var mqttLayer = require('./mqtt-layer');

class MqttStack {

    constructor() {

        this.stack = [];
        this.topic = "";
        this.options = {};
        this.default = undefined;

    }

    /**
    * Goes through stack then calls handle on matching route, if any
    * @private
    */

    execute() {
        var matchingLayer = this.iterate();
        if (!matchingLayer) {
            // no matching path, execute default behavior if defined
            if (!this.default) {
                console.log('No default behavior implemented, message ignored');
                return;
            }
            this.default(this.topic, this.payload);
            return;
        }
        matchingLayer.handleTopic(this.topic, this.payload);
    }

    /**
    * Iterates over the router stack, and returns the first matching path (if any)
    * @private
    */

    iterate() {
        var index = 0;
        var match, layer;
        while ( index < this.stack.length && match !== true) {
            layer = this.stack[index];
            match = this.matchLayer(layer, this.topic)
            index ++;
        }
        if (match !== true) {
            // no matching path in stack, dispatch warning
            console.log('WARNING: no matching path!');
            return;
        }
        return layer;
    }

    /**
    * Tests for compatibility between a Layer and a topic
    * @param {Layer} layer
    * @param {MQTTTopic} topic
    * @private
    */
    matchLayer(layer, topic) {
        try {
            return layer.match(topic);
        } catch (err) {
            return err;
        }

    }

    /**
    * Adds the specified function to the mqtt router, at a given path (path '#' matches to all)
    * @param {Path} path
    * @param {function} fn
    * @public
    */

    add(path, handle) {
        var layer = new mqttLayer(path, this.options, handle);
        this.stack.push(layer);
    }

    /**
    * Adds default path to stack (will be performed if a channel is subscribed outside the router)
    * @param {function} fn
    */

    addDefault(handle) {
        if (this.default) {
            throw new Error('MqttStack can only have one default function!')
        }
        this.default = handle;
    }

    /**
    * Uses the router
    * @param {MQTTTopic} topic
    * @param {MQTTPayload} payload
    * @public
    */

    use(topic, payload) {
        this.topic = topic;
        this.payload = payload;
        this.execute();
    }
}

/**
* Module export
* @public
*/

module.exports = MqttStack;
