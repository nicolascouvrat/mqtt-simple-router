const sinon = require('sinon');
const chai = require('chai');
chai.use(require('sinon-chai'));
const expect = chai.expect;

const MqttLayer = require('../lib/mqtt-layer');
const pathToRegexp = require('path-to-regexp');
const NOOP = () => {};

describe('The MqttLayer module:', function() {
  it('has a working testing environment', function() {
    var test = 1;
    expect(test).to.be.equal(1);
  });

  describe('handles requests, and: ', function() {
    it('passes the request to its handle, if it is a valid request handler', function() {
      var path = 'path';
      var request = {};
      var next = this.sandbox.stub();
      var handle = this.sandbox.stub().callsFake((request, next) => {});
      var invalidHandle = this.sandbox.spy((too, much, params, there) => {});

      var layer = new MqttLayer(path, handle);
      layer.handleRequest(request, next);

      expect(handle).to.have.been.calledOnce;
      expect(next).to.have.been.not.called;

      layer = new MqttLayer(path, invalidHandle);
      layer.handleRequest(request, next);

      expect(invalidHandle).to.not.have.been.called;
      expect(next).to.have.been.calledOnce;


    });

    it('passes the request and error to its handle, if it is a valid error handler', function() {
      var path = 'path';
      var request = {};
      var error = new Error('error!');
      var next = this.sandbox.stub();
      var handle = this.sandbox.stub().callsFake((request, next) => {});
      var errorHandle = (error, request, next) => {};
      var errorHandleSpy = this.sandbox.spy(errorHandle);

      var layer = new MqttLayer(path, errorHandleSpy);
      layer.handleRequest_error(error, request, next);

      expect(errorHandleSpy).to.have.been.calledOnce;
      expect(next).to.not.have.been.called;

      layer = new MqttLayer(path, handle);
      layer.handleRequest_error(error, request, next);
      expect(handle).to.have.not.been.called;
      expect(next).to.have.been.calledWith(error);
    });

    it('passes any error thrown by the handle back to next()', function() {
      var path = 'path';
      var request = {};
      var error = new Error('error!');
      var next = this.sandbox.stub();
      var handle = this.sandbox.stub().throws(error);

      var layer = new MqttLayer(path, handle);
      layer.handleRequest(request, next);

      expect(next).to.have.been.calledWith(error);

      var nextError = new Error('new error');
      var errorHandle = (error, request, next) => {throw nextError;};

      var layer = new MqttLayer(path, errorHandle);
      layer.handleRequest_error(error, request, next);

      expect(next).to.have.been.calledTwice;
      expect(next).to.have.been.calledWith(nextError);
    });

    it('fills request.params', function() {
      var path = 'path';
      var request = {};
      var params = {
        param1: 'value',
        param2: 'value2',
      };
      var dummyHandle = (request, next) => {};
      var next = NOOP;
      var layer = new MqttLayer(path, dummyHandle);

      layer.params = params;
      layer.handleRequest(request, next);

      expect(request.params).to.deep.equal(params);
    });
  });

  describe('has a match() function that: ', function() {

    it('tests a MQTT path against its own path', function() {
      var path = '/this/is/a/';
      var firstTest = '/this/is/a/not/compatible/path';
      var secondTest = '/not/compatible';
      var thirdTest = '/this/is/a/'

      var layer = new MqttLayer(path, NOOP);

      expect(layer.match(firstTest)).to.be.equal(false);
      expect(layer.match(secondTest)).to.be.equal(false);
      expect(layer.match(thirdTest)).to.be.equal(true);
    });

    it('handles the true-for-all # joker by using a bypass', function() {
      var path = '#';
      var test = '/a/path';

      var layer = new MqttLayer(path, NOOP);
      //cannot be spied on earlier, as replace method calls exec...
      const execSpy = this.sandbox.spy(RegExp.prototype, 'exec');
      layer.match(test);

      expect(execSpy).to.have.callCount(0);

    });

    it('handles the end-of-path MQTT joker "#"', function() {
      var path = '/a/path/#';
      var firstTest = '/a/path/that/works';
      var secondTest = 'a/path/that/does/not';
      var layer = new MqttLayer(path, NOOP);

      expect(layer.match(firstTest)).to.be.equal(true);
      expect(layer.match(secondTest)).to.be.equal(false);

    });

    it('handles the MQTT "+" joker', function() {
      var path ='a/path/that/+';
      var firstTest = 'a/path/that/works/';
      var secondTest = 'a/path/that/does/not/';
      var layer = new MqttLayer(path, NOOP);

      expect(layer.match(firstTest)).to.be.equal(true);
      expect(layer.match(secondTest)).to.be.equal(false);
    });

    it('populates a params object with an unamed entry for each + token', function() {
      const path = 'a/:path/that/+';
      const test = 'a/giraffe/that/rocks';
      const expectedParamsObject = {
        path: 'giraffe',
        0: 'rocks',
      };
      var layer = new MqttLayer(path, NOOP);
      var match = layer.match(test);

      expect(match).to.be.equal(true);
      expect(layer.params).to.deep.equal(expectedParamsObject);
    });

  });

});
