var mqtt = require('mqtt');
var mqttRouter = require('mqtt-simple-router');

var client = mqtt.connect('mqtt://localhost');

// the topic returned is an object containing both .topic (the original topic) and .params (containing named parameter values, or undefined)

router.auto('/all/hello', function(topic, payload) {
    // automatically subscribe on router.wrap()
    console.log('new message on ' + topic.topic + ': ' + payload);
});

router.manual('/all/hello/message', function(topic, payload) {
    //will NOT automatically subscribe
    console.log('new message on ' + topic.topic + ': ' + payload);
});

router.auto('/:channel', function(topic, payload) {
    console.log('new message on channel ' + topic.params.channel + ': ' + payload);
});

router.manual('/+/:subchannel/#', function(topic, payload) {
    console.log('new message containing subchannel ' + topic.params.subchannel + ': ' + payload);
});

router.default(function(topic, payload) {
    // will be used for any messages received on topics that have been subscribed to outside of the router
    console.log('unhandled behavior: ' + topic.topic + payload);
});

router.wrap(client);

module.exports = client;
