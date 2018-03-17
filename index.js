'use strict';

const _ = require('lodash');
const moment = require('moment');
const winston = require('winston');
const config = require('./config.json');
const jsonFile = require('jsonfile')

const logger = (function () {
    const config = winston.config;
    const logger = new (winston.Logger)({
      transports: [
        new (winston.transports.Console)({
          timestamp: function() {
            return moment().format('YYYY-MM-DD hh:mm:ss:SSS');
          },
          formatter: function(options) {
            // - Return string will be passed to logger.
            // - Optionally, use options.colorize(options.level, <string>) to
            //   colorize output based on the log level.
            return options.timestamp() + ' ' +
              config.colorize(options.level, options.level.toUpperCase()) + ' ' +
              (options.message ? options.message : '') +
              (options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
          }
        })
      ]
    });
    return logger;    
}());

const Todoist = require('./todoist');
const todoist = new Todoist(config.todoist.token, logger);

const Habitica = require('./habitica');
const habitica = new Habitica(config.habitica.apiUser, config.habitica.apiKey);
const Sync = require('./sync');

const lastRun = jsonFile.readFileSync('lastRun.json', {throws: false}) || {};
new Sync(todoist, habitica, logger)
	.sync(lastRun)
	.then(config => {
        const sync = config.sync;
        lastRun.syncToken = sync.sync_token;
        jsonFile.writeFileSync('lastRun.json', lastRun);
    })
    .then(() => console.log('done'));
