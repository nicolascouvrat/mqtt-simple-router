var mqtt = require('mqtt');
var mqttRouter = require('../index.js');

var client = mqtt.connect({
    host: '192.168.201.104',
    port: 8084
});
var router = new mqttRouter();

// the topic returned is an object containing both .topic (the original topic) and .params (containing named parameter values, or undefined)

router.auto('/all/hello', function(request) {
    // automatically subscribe on router.wrap()
    console.log('new message on ' + request.topic + ': ' + request.payload);
});

router.manual('/all/hello/message', function(request) {
    //will NOT automatically subscribe
    console.log('new message on ' + request.topic + ': ' + request.payload);
});

router.auto('/:channel/#', function(request, next) {
    console.log('new message on channel (general) ' + request.params.channel);
    console.log(request.params);
    request.payload = 'changed';
    next();
})

router.auto('/:stuff/specific', function(request, next) {
    console.log('new message on channel (specific)' + request.params.stuff + ': ' + request.payload);
    console.log(request.params);
    next();

});

router.default(function(request) {
    // will be used at the 'end of the line', i.e. when either:
    // a message doesnt fit any topic (subscribed after router set up)
    // next() has been called but their is no matching function left in the stack
    console.log('unhandled behavior: ' + request.topic + request.payload);
});

router.wrap(client);

module.exports = client;
