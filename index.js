'use strict';

const _ = require('lodash');
const jsonFile = require('jsonfile')

const configPath = process.env.TODOIST_HABITICA_CONFIG_PATH || "./config.json";
const config = require(configPath);
const logger = require('./logger');
const Habitica = require('./habitica');
const Todoist = require('./todoist');
const Sync = require('./sync');

const todoist = new Todoist(config.todoist.token, logger);
const habitica = new Habitica(config.habitica.apiUser, config.habitica.apiKey, logger);
const lastRun = jsonFile.readFileSync('lastRun.json', {throws: false}) || {};

logger.info("Sync started");
new Sync(todoist, habitica, logger, config)
    .sync(lastRun)
    .then(config => {
        const sync = config.sync;
        lastRun.syncToken = sync.sync_token;
	logger.info('Sync finished, writing lastRun.json', lastRun);
        jsonFile.writeFileSync('lastRun.json', lastRun);
    })
    .then(() => logger.info('done'));
