var mqttLayer = require('./mqtt-layer');

class MqttStack {

    constructor() {

        this.request = {};
        // inherited from the router
        this.options = {};
        // all layers EXCEPT DEFAULT
        this.stack = [];
        // a function out of layer, optional
        this.default = undefined;

    }

    /**
    * Goes through stack then calls handle on matching route, if any
    * @private
    */

    execute() {

        var index = 0;
        var next = (err) => {
            if (err) {
                // error handling
                console.log('an error happened when going through the stack');
                return;
            }

            // find the next route
            var match, layer;

            while ( index < this.stack.length && match !== true) {
                layer = this.stack[index];
                match = this.matchLayer(layer, this.request)
                index ++;
            }

            if (match !== true) {
                // no matching path left in stack

                console.log('Reached end of the stack');
                // default procedure, if exists
                if (this.default) {
                    this.default(this.request);
                }
                return;
            }

            layer.handleRequest(this.request, next)


        }

        this.request.next = next; //is that useful?

        next();
    }

    /**
    * Tests for compatibility between a Layer and a topic
    * @param {Layer} layer
    * @param {MQTTRequest} request
    * @private
    */
    matchLayer(layer, request) {
        try {
            return layer.match(request.topic);
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
    * @public
    */

    addDefault(handle) {
        if (this.default) {
            throw new Error('MqttStack can only have one default function!')
        }
        this.default = handle;
    }

    /**
    * Uses the stack for the given request
    * Builds a custom MQTTRequest request object, containing topic & payload
    * @param {MQTTTopic} topic
    * @param {MQTTPayload} payload
    * @public
    */

    use(topic, payload) {
        this.request.topic = topic;
        this.request.payload = payload;
        this.execute();
    }
}

/**
* Module export
* @public
*/

module.exports = MqttStack;
