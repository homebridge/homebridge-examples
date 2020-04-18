import http, {IncomingMessage, Server, ServerResponse} from "http";
import {
  API,
  APIEvent,
  CharacteristicSetCallback,
  CharacteristicValue,
  DynamicPlatformPlugin,
  HAP,
  Logging,
  PlatformAccessory,
  PlatformAccessoryEvent,
  PlatformConfig,
  Service,
} from "homebridge";

const PLUGIN_NAME = "homebridge-dynamic-platform-example";
const PLATFORM_NAME = "ExampleDynamicPlatform";

/**
 * TODO explain
 */
let hap: HAP;
let Accessory: typeof PlatformAccessory;

export = (api: API) => {
  hap = api.hap;
  Accessory = api.platformAccessory;

  api.registerPlatform(PLATFORM_NAME, ExampleDynamicPlatform);
};

class ExampleDynamicPlatform implements DynamicPlatformPlugin {

  private readonly log: Logging;
  private readonly api: API;

  private requestServer?: Server;

  private readonly accessories: PlatformAccessory[] = [];

  constructor(log: Logging, config: PlatformConfig, api: API) {
    this.log = log;
    this.api = api;

    // probably parse config or something here

    log.info("Example platform finished initializing!");

    /*
     * When this event is fired, homebridge restored all cached accessories from disk and did call their respective
     * `configureAccessory` method for all of them. Dynamic Platform plugins should only register new accessories
     * after this event was fired, in order to ensure they weren't added to homebridge already.
     * This event can also be used to start discovery of new accessories.
     */
    api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
      log.info("Example platform 'didFinishLaunching'");

      // The idea of this plugin is that we open a http service which exposes api calls to add or remove accessories
      this.createHttpService();
    });
  }

  /*
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory): void {
    this.log("Configuring accessory %s", accessory.displayName);

    accessory.on(PlatformAccessoryEvent.IDENTIFY, () => {
      this.log("%s identified!", accessory.displayName);
    });

    accessory.getService(hap.Service.Lightbulb)!.getCharacteristic(hap.Characteristic.On)
      .on(hap.CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        this.log.info("%s Light was set to: " + value);
        callback();
      });

    this.accessories.push(accessory);
  }

  // --------------------------- CUSTOM METHODS ---------------------------

  addAccessory(name: string) {
    this.log.info("Adding new accessory with name %s", name);

    // uuid must be generated from a unique but not changing data source, name should not be used in the most cases. But works in this specific example.
    const uuid = hap.uuid.generate(name);
    const accessory = new Accessory(name, uuid);

    accessory.addService(hap.Service.Lightbulb, "Test Light");

    this.configureAccessory(accessory); // abusing the configureAccessory here

    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
  }

  removeAccessories() {
    // we don't have any special identifiers, we just remove all our accessories

    this.log.info("Removing all accessories");

    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, this.accessories);
    this.accessories.splice(0, this.accessories.length); // clear out the array
  }

  createHttpService() {
    this.requestServer = http.createServer(this.handleRequest.bind(this));
    this.requestServer.listen(18081, () => this.log.info("Http server listening on 18081..."));
  }

  private handleRequest(request: IncomingMessage, response: ServerResponse) {
    if (request.url === "/add") {
      this.addAccessory(new Date().toISOString());
    } else if (request.url === "/remove") {
      this.removeAccessories();
    }

    response.writeHead(204); // 204 No content
    response.end();
  }

  // ----------------------------------------------------------------------

}
