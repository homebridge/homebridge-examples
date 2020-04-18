import {
  API,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  HAP,
  IndependentPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig,
} from "homebridge";

const PLUGIN_NAME = "homebridge-independent-platform-example";
const PLATFORM_NAME = "ExampleIndependentPlatform";

/**
 * TODO explain
 */
let hap: HAP;
let Accessory: typeof PlatformAccessory;

export = (api: API) => {
  hap = api.hap;
  Accessory = api.platformAccessory;

  api.registerPlatform(PLATFORM_NAME, ExampleIndependentPlatform);
};

class ExampleIndependentPlatform implements IndependentPlatformPlugin {

  private readonly log: Logging;
  private readonly api: API;

  constructor(log: Logging, config: PlatformConfig, api: API) {
    this.log = log;
    this.api = api;

    // probably parse config or something here

    this.publishExampleExternalAccessory("MySwitch 1");

    log.info("Example platform finished initializing!");
  }

  publishExampleExternalAccessory(name: string) {
    let switchOn = false;

    const uuid = hap.uuid.generate("homebridge:examples:external-switch:" + name);
    const accessory = new Accessory("External Switch", uuid);

    const switchService = new hap.Service.Switch(name);
    switchService.getCharacteristic(hap.Characteristic.On)
      .on(hap.CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        this.log.info("Current state of the switch was returned: " + (switchOn? "ON": "OFF"));
        callback(undefined, switchOn);
      })
      .on(hap.CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
        switchOn = value as boolean;
        this.log.info("Switch state was set to: " + (switchOn? "ON": "OFF"));
        callback();
      });

    accessory.getService(hap.Service.AccessoryInformation)!
      .setCharacteristic(hap.Characteristic.Manufacturer, "Custom Manufacturer")
      .setCharacteristic(hap.Characteristic.Model, "External Switch");

    accessory.addService(switchService);

    // will be exposed as an additional accessory and must be paired separately with the pincode of homebridge
    this.api.publishExternalAccessories(PLUGIN_NAME, [accessory]);
  }

}
