import {
  API,
  CharacteristicEventTypes,
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

/*
 * IMPORTANT NOTICE
 *
 * One thing you need to take care of is, that you never ever ever import anything directly from the "homebridge" module (or the "hap-nodejs" module).
 * The above import block may seem like, that we do exactly that, but actually those imports are only used for types and interfaces
 * and will disappear once the code is compiled to Javascript.
 * In fact you can check that by running `npm run build` and opening the compiled Javascript file in the `dist` folder.
 * You will notice that the file does not contain a `... = require("homebridge");` statement anywhere in the code.
 *
 * The contents of the above import statement MUST ONLY be used for type annotation or accessing things like CONST ENUMS,
 * which is a special case as they get replaced by the actual value and do not remain as a reference in the compiled code.
 * Meaning normal enums are bad, const enums can be used.
 *
 * You MUST NOT import anything else which remains as a reference in the code, as this will result in
 * a `... = require("homebridge");` to be compiled into the final Javascript code.
 * This typically leads to unexpected behavior at runtime, as in many cases it won't be able to find the module
 * or will import another instance of homebridge causing collisions.
 *
 * To mitigate this the {@link API | Homebridge API} exposes the whole suite of HAP-NodeJS inside the `hap` property
 * of the api object, which can be acquired for example in the initializer function. This reference can be stored
 * like this for example and used to access all exported variables and classes from HAP-NodeJS.
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
      .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
        this.log.info("Current state of the switch was returned: " + (switchOn? "ON": "OFF"));
        callback(undefined, switchOn);
      })
      .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
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
