"use strict";

const sinon = require("sinon");

beforeEach(function () {
  if (null == this.sinon) {
    this.sinon = sinon.createSandbox();
  } else {
    this.sinon.restore();
  }
});

require("./habitica.spec.js");
require("./todoist.spec.js");
require("./sync.spec.js");
