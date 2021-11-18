'use strict';

const _ = require('lodash');
const moment = require('moment');
const winston = require('winston');

const config = winston.config;

const options = {
      timestamp: function() {
        return moment().format('YYYY-MM-DD hh:mm:ss:SSS');
      },
      formatter: function(options) {
        return options.timestamp() + ' ' +
          config.colorize(options.level, options.level.toUpperCase()) + ' ' +
          (options.message ? options.message : '') +
          (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
      }
    };
module.exports = (configDir) => new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(options),
    new (winston.transports.File)(_.extend({}, options, { filename: configDir + 'sync.log' }))
  ]
});
