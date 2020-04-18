import http, {IncomingMessage, Server, ServerResponse} from "http";
import {
  API,
  APIEvent,
  CameraControllerOptions,
  DynamicPlatformPlugin,
  HAP,
  Logging,
  PlatformAccessory,
  PlatformAccessoryEvent,
  PlatformConfig,
} from "homebridge";
import {ExampleFFMPEGStreamingDelegate} from "./streamingDelegate";

const PLUGIN_NAME = "homebridge-bridged-camera-example";
const PLATFORM_NAME = "ExampleDynamicCameraPlatform";

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

    const streamingDelegate = new ExampleFFMPEGStreamingDelegate(hap);
    const options: CameraControllerOptions = {
      cameraStreamCount: 2, // HomeKit requires at least 2 streams, but 1 is also just fine
      delegate: streamingDelegate,

      streamingOptions: {
        // srtp: true, // legacy option which will just enable AES_CM_128_HMAC_SHA1_80 (can still be used though)
        supportedCryptoSuites: [hap.SRTPCryptoSuites.NONE, hap.SRTPCryptoSuites.AES_CM_128_HMAC_SHA1_80], // NONE is not supported by iOS just there for testing with Wireshark for example
        video: {
          codec: {
            profiles: [hap.H264Profile.BASELINE, hap.H264Profile.MAIN, hap.H264Profile.HIGH],
            levels: [hap.H264Level.LEVEL3_1, hap.H264Level.LEVEL3_2, hap.H264Level.LEVEL4_0],
          },
          resolutions: [
            [1920, 1080, 30], // width, height, framerate
            [1280, 960, 30],
            [1280, 720, 30],
            [1024, 768, 30],
            [640, 480, 30],
            [640, 360, 30],
            [480, 360, 30],
            [480, 270, 30],
            [320, 240, 30],
            [320, 240, 15], // Apple Watch requires this configuration (Apple Watch also seems to required OPUS @16K)
            [320, 180, 30],
          ],
        },
        /* audio option is omitted, as it is not supported in this example; HAP-NodeJS will fake an appropriate audio codec
        audio: {
            comfort_noise: false, // optional, default false
            codecs: [
                {
                    type: AudioStreamingCodecType.OPUS,
                    audioChannels: 1, // optional, default 1
                    samplerate: [AudioStreamingSamplerate.KHZ_16, AudioStreamingSamplerate.KHZ_24], // 16 and 24 must be present for AAC-ELD or OPUS
                },
            ],
        },
        // */
      }
    }

    const cameraController = new hap.CameraController(options);
    streamingDelegate.controller = cameraController;

    accessory.configureController(cameraController);

    this.accessories.push(accessory);
  }

  // --------------------------- CUSTOM METHODS ---------------------------

  addAccessory(name: string) {
    this.log.info("Adding new accessory with name %s", name);

    // uuid must be generated from a unique but not changing data source, name should not be used in the most cases. But works in this specific example.
    const uuid = hap.uuid.generate(name);
    const accessory = new Accessory(name, uuid);

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
