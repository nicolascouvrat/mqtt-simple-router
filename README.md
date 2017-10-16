# MQTT simple router

This simple module allows you to centralize both subscribing to [MQTT](https://www.npmjs.com/package/mqtt) topics and reacting to subsequent messages on that topic in a router-type file. 
The router uses [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) in order to provide path recognition and named parameters 

The creation of this module was motivated by the annoyance that is having both subscription code and listening code separated, and the nightmare that are chained if / elseif statements. 
It aims at providing a simple solution to these problems.

## Installation

This is a [Node.js](https://nodejs.org/en/) module available for download on the [npm registry](https://www.npmjs.com/package/mqtt-simple-router)

To intall this module, simply run `npm install`
```
$ npm install mqtt-simple-router
```

### Dependencies

MQTT requires the [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) module, available on npm.

### Usage - Quick start

The basic idea is simple and heavily inspired by Express.js's router : define routes for your router first, then wrap that router around the MQTT client once connected.

Two commands can be used to define routes: `router.auto()` and `router.manual()`.
While the first will automatically subscribe to the relevant topic(s) on router.wrap(client), the second will not and therefore requires you to do it manually later by the usual `client.subscribe(topic)`

**Note:** the `topic` passed to the callback function is an object containing both `topic.topic` (the original topic) and `topic.params` (undefined, or containing the named parameters' value).

```js
var mqtt = require('mqtt');
var mqttRouter = require('mqtt-simple-router');

var client = mqtt.connect('mqtt://localhost');

var router = new mqttRouter();

// the topic returned is an object containing both
// .topic (the original topic) and 
// .params (containing named parameter values, or undefined)

router.auto('/all/hello', function(topic, payload) {
    // automatically subscribe on router.wrap()
    console.log('new message on ' + topic.topic + ': ' + payload);
});

router.manual('/all/hello/message', function(topic, payload) {
    //will NOT automatically subscribe
    console.log('new message on ' + topic.topic + ': ' + payload);
});

// wrap the router around the client, subscribing to topics specified by auto
router.wrap(client); 
```

Named parameters can be used, by preceding them with a semicolon `:`. Their value can then be accessed in `topic.params.parameter_name`.
The module also supports the MQTT jokers, treating '+' as a nameless parameter.

```js
router.auto('/:channel', function(topic, payload) {
    console.log('new message on channel ' + topic.params.channel + ': ' + payload);
});

router.manual('/+/:subchannel/#', function(topic, payload) {
    console.log('new message containing subchannel ' + topic.params.subchannel + ': ' + payload);
});
```
**Important warning concerning jokers:** The router goes through the path stack **in order**, and stops at the first fitting path.
Which means that - depending on the order in which they are created - some path can be unreachable:

```js
router.auto('/:param/#', function(topic, payload) {
    // some logic
});

router.auto('/:param/:subparam', function(topic, payload) {
    // will never be used because every topic fitting this path also fits the previous one.
});
```

Finally, a default handler can also be defined, in case the client is subscribed to more topics than the ones covered by the router.
```js
router.default(function(topic, payload) {
    // router.default() will throw an error if used more than once
    console.log('unhandled behavior: ' + topic.topic + payload);
});
```

## Authors

* **Nicolas Couvrat** - *Initial work* - [website](http://www.nicolascouvrat.com)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

