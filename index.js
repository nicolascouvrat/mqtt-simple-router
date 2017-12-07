var mqttStack = require('./lib/mqtt-stack');

class MqttRouter {

    constructor() {
        this.client = undefined;
        this.stack = new mqttStack();
        this.subscribe = [];
        this.paths = [];
        this.unactiveLayers = {};
    }

    /**
    * Add path to stack and will automatically subscribe on client connection via subscriber module
    * @param {Path} path
    * @param {function} fn
    * @public
    */

    auto(path, fn) {

        if(typeof path !== 'string') {
            throw new TypeError('MqttRouter.auto() requires a path but got a ' + typeof path + ' instead!');
        }

        if(typeof fn !== 'function') {
            throw new TypeError('MqttRouter.auto() requires a function but got a ' + typeof fn + ' instead!');
        }

        this.stack.add(path, fn);
        this.subscribe.push(path);
        this.paths.push(path);

    }

    /**
    * Add path to stack but will NOT automatically subscribe on client connection
    * @param {Path} path
    * @param {function} fn
    * @param {string} alias the (temporary) alias under which
    *                       the layer will be saved for acivation.
    *                       if this parameter is not provided, the default
    *                       alias will be the provided path.
    * @public
    */

    manual(path, fn, alias) {

      if(typeof path !== 'string') {
          throw new TypeError('MqttRouter.manual() requires a path but got a ' + typeof path + ' instead!');
      }

      if(typeof fn !== 'function') {
          throw new TypeError('MqttRouter.manual() requires a function but got a ' + typeof fn + ' instead!');
      }
      // default alias is path
      alias = alias || path;
      if (this.unactiveLayers.alias) {
        throw new Error('Aliases for MqttRouter.manual() should be unique!');
      }
      this.unactiveLayers[alias] = { path: path, fn: fn };
      this.paths.push(path);
    }

    activate(alias) {
      if (!this.unactiveLayers.alias) {
        throw new Error(`Unknown alias: ${alias}`);
      }
      var layer = this.unactiveLayers.alias;
      this.stack.add(layer.path, layer.fn);
      this.client.subscribe(this.trimPath(layer.path));
      // remove from unactiveLayers
      delete this.unactiveLayers.alias;
    }

    /**
    * Add default handler to the stack (unique)
    * @param {function} fn
    * @public
    */

    defaultHandler(fn) {
        if(typeof fn !== 'function') {
            throw new TypeError('MqttRouter.defaultHandler() requires a function but got a ' + typeof fn + ' instead!');
        }
        this.stack.addDefaultHandler(fn);
    }

    /**
    * Wraps router around mqtt client
    * @param {MQTTClient} mqttClient
    * @public
    */

    wrap(mqttClient) {
        this.client = mqttClient;

        // subscribe to topics marked by auto
        for (var i = 0; i < this.subscribe.length; i++) {
            this.client.subscribe(this.trimPath(this.subscribe[i]));
        }

        // use provided stack on message received
        this.client.on('message', (topic, payload) => {
            console.log('got it');
            this.stack.use(topic, payload);
        })
    }

    /**
    * Trims path to make it a valid MQTT topic
    * @param {Path} path
    * @return {MQTTTopic}
    * @private
    */

    trimPath(path) {
        // path-to-regexp named parameters are composed of english characters only
        var regexp = /:[A-Za-z0-9_]+/g;
        return path.replace(regexp, "+");
    }

    get active() {
        return !(this.client === undefined);
    }

}

module.exports = MqttRouter;
