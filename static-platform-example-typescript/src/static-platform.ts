import {AccessoryPlugin, API, HAP, Logging, PlatformConfig, StaticPlatformPlugin,} from "homebridge";
import {ExampleSwitch} from "./switch-accessory";

const PLATFORM_NAME = "ExampleStaticPlatform";

/**
 * TODO explain
 */
let hap: HAP;

export = (api: API) => {
  hap = api.hap;

  api.registerPlatform(PLATFORM_NAME, ExampleStaticPlatform);
};

class ExampleStaticPlatform implements StaticPlatformPlugin {

  private readonly log: Logging;

  constructor(log: Logging, config: PlatformConfig, api: API) {
    this.log = log;

    // probably parse config or something here

    log.info("Example platform finished initializing!");
  }

  /*
   * This method is called to retrieve all accessories exposed by the platform.
   * The Platform can delay the response my invoking the callback at a later time,
   * it will delay the bridge startup though, so keep it to a minimum.
   * The set of exposed accessories CANNOT change over the lifetime of the plugin!
   */
  accessories(callback: (foundAccessories: AccessoryPlugin[]) => void): void {
    callback([
      new ExampleSwitch(hap, this.log, "Switch 1"),
      new ExampleSwitch(hap, this.log, "Switch 2"),
    ]);
  }

}
