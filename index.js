"use strict";

const _ = require("lodash");
const jsonFile = require("jsonfile");

const resolveConfigDir = () => {
  const configDir = process.env.CONFIG_DIR || "./";
  return configDir.endsWith("/") ? configDir : configDir + "/";
};
const configDir = resolveConfigDir();

const config = require(configDir + "config.json");
const logger = require("./logger")(configDir);
const Habitica = require("./habitica");
const Todoist = require("./todoist");
const Sync = require("./sync");

const todoist = Todoist.from(config.todoist.token, logger);
const habitica = Habitica.from(
  config.habitica.apiUser,
  config.habitica.apiKey,
  logger
);
const lastRun =
  jsonFile.readFileSync(configDir + "lastRun.json", { throws: false }) || {};

logger.info("Sync started");
new Sync(todoist, habitica, logger, config)
  .sync(lastRun)
  .then((config) => {
    const sync = config.sync;
    lastRun.syncToken = sync.sync_token;
    logger.info("Sync finished, writing lastRun.json", lastRun);
    jsonFile.writeFileSync(configDir + "lastRun.json", lastRun);
  })
  .then(() => logger.info("done"));
