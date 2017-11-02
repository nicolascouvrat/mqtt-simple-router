var mqtt = require('mqtt');
var mqttRouter = require('mqtt-simple-router');

var client = mqtt.connect('mqtt://localhost');
var router = new mqttRouter();

// the request object returned is an object containing
// .topic (the original topic)
// .payload
// .path and
// .params (containing named parameter values, or undefined)

router.auto('/all/hello', function(request) {
    // automatically subscribe on router.wrap()
    console.log('new message on ' + request.topic + ': ' + request.payload);
});

router.auto('/all/hello/message', function(request, next) {
    console.log('new message on ' + request.topic + ': ' + request.payload);
    request.payload = 'modified';
    next();
});

router.auto('/all/hello/message', function(request, next) {
    console.log('new message on ' + request.topic + ': ' + request.payload);
    // payload will be equal to 'modified'
});

/*
 * Named parameters
 */

router.auto('/:channel', function(request, next) {
    console.log('new message on channel ' + request.params.channel + ': ' + request.payload);
});

router.auto('/+/:subchannel/#', function(request, next) {
    console.log('new message containing subchannel ' + request.params.subchannel + ': ' + request.payload);
});

/*
 * error handling
 */

router.defaultHandler(function(error, request) {
    // all errors non treated by custom error handlers will end up here
    console.log("An error has happened!");
    // ...
});

router.auto('/all/error', function(error, request, next) {
    // must have these 3 arguments, even if next() is not used
    if  (error.name === 'RangeError') {
        console.log('There was a range error :(')
    }
    else {
        next(error);
        // other errors are send to the next handler
    }
})

// wrap the router around the client, subscribing to topics specified by auto
router.wrap(client);
