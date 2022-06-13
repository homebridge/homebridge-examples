# homebridge-examples

This repo bundles some example implementations for homebridge plugins. They provide some example code to get 
started with. They are also published on npm like regular plugins, so you can easily run them in your local
homebridge instance. Refer to the respective `package.json` for the plugin name and install them as usual.

The examples are all written in Typescript and thus require at least homebridge `v1.0.0`.  
To build a plugin run the following commands in the respective plugin directory.

Run this command once to install all dependencies required by the plugin:
```
npm install
``` 

After that run the following command to compile the Typescript files into Javascript
(repeat this step every time you change something in the code).
```
npm run build
```

If you're trying to get one of the example plugins to show up in your homebridge installation without installing it
from npm just clone this repo.
Then, just cd into one of the plugin folders and run
```
npm link
```
Pay attention to not start homebridge with the --strict-plugin-resolution flag. A standard installation of 
homebridge might start it with that flag in a start script, located in /opt/homebridge on linux.


If you need inspiration for a plugin written in Javascript you can just run the above commands and look at the 
generated Javascript code located in the `./dist` folder. You may need to ignore some code at the beginning of the file 
generated by the Typescript compiler.

## Examples for different homebridge plugin types

#### Accessory Plugins

Accessory plugins are the most basic and simplest plugins for homebridge. They should be used if you only want to 
expose a single accessory and don't require any special functionality.

* [Accessory Plugin](./accessory-example-typescript): A simple Switch accessory.

#### Platform Plugins:

Platform plugins are able to expose multiple accessories. Additionally, they are required if you want to use the 
Controller API. 

* [Static Platform Plugin](./static-platform-example-typescript): Static platforms know which accessories they want to 
expose on start up. The set of accessories cannot change over the lifespan of the plugin.
* [Dynamic Platform Plugin](./dynamic-platform-example-typescript): Dynamic platforms can dynamically add or remove 
accessories at runtime. Accessories are fully stored to disk by homebridge, and the exact state is reconstructed on
a reboot. The plugin can store additional context as well. 
* [Independent Platform Plugin](./independent-platform-example-typescript): Independent platforms are typically used
when the platform intends to only expose external accessories or provides other functionality while not exposing
an accessory at all.

## Other example plugins

* [Bridged Camera Platform](./bridged-camera-example-typescript)
