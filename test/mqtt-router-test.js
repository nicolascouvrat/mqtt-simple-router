var mqtt = require('mqtt');
var router = require('./test-router');

var MQTT_BROKER_IP = '192.168.201.104',
    MQTT_PORT = 8084;

var client = mqtt.connect({
    host: MQTT_BROKER_IP,
    port: MQTT_PORT,
});

console.log(router);
router.wrap(client);

module.exports = client;
