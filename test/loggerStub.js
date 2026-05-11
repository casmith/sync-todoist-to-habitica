"use strict";

module.exports = class LoggerStub {
  constructor() {
    this.warns = [];
    this.infos = [];
    this.errors = [];
  }
  warn(msg) {
    this.warns.push(String(msg));
  }
  info(msg) {
    this.infos.push(String(msg));
  }
  error(msg) {
    this.errors.push(String(msg));
  }
};
