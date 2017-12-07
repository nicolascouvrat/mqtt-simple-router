var mqttLayer = require('./mqtt-layer');

class MqttStack {

    constructor() {

        this.request = {};
        // inherited from the router
        this.options = {};
        // all layers EXCEPT DEFAULT HANDLER
        this.stack = [];
        // handle all remaining errors at the end of stack
        // default behavior can be modified at router instanciation
        this.defaultHandler = (error, request) => {
            if (error) {
                console.log('Error in ', request.path, ': ', error.stack);
            }
        };

    }

    /**
    * Goes through stack then calls handle on matching route, if any
    * @private
    */

    execute() {

        var index = 0;
        var next = (err) => {
            var layerError = err;

            // find the next route
            var match, layer;

            while ( index < this.stack.length && match !== true) {
                layer = this.stack[index];
                match = this.matchLayer(layer, this.request);
                index ++;

                if (match !== true) {
                    continue;
                }

                if (layerError && layer.handle.length !== 3) {
                    // if error, skip all non error handlers;
                    match = false;
                    continue;
                }
            }

            if (match !== true) {
                // no matching path left in stack
                if (layerError) {
                    // handle remaining errors
                    this.defaultHandler(layerError, this.request);
                    return;
                }
                // done
                return;
            }
            // store last path for dispatch on error
            this.request.path = layer.path;
            if (layerError) {
                layer.handleRequest_error(layerError, this.request, next)
            }
            else {
                layer.handleRequest(this.request, next)
            }
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
        var layer = new mqttLayer(path, handle, this.options);
        this.stack.push(layer);
    }

    /**
    * Adds default path to stack (will be performed if a channel is subscribed outside the router)
    * @param {function} fn
    * @public
    */

    addDefaultHandler(handle) {
        if (handle.length < 2) {
            throw new TypeError('A default handler must have an error argument!')
        }
        this.defaultHandler = handle;
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
