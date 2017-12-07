var sinon = require('sinon');
var chai = require('chai');

beforeEach(function() {
  this.sandbox = sinon.sandbox.create();
});

afterEach(function() {
  this.sandbox.restore();
})
