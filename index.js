"use strict";

const _ = require("lodash"),
  jsonFile = require("jsonfile"),
  fs = require("fs");

const resolveConfigDir = () => {
  const configDir = process.env.CONFIG_DIR || "./";
  return configDir.endsWith("/") ? configDir : configDir + "/";
};
const configDir = resolveConfigDir();
const logger = require("./logger")(configDir);

const configFile = configDir + "config.json";
let config;
if (fs.existsSync(configFile)) {
  config = require(configFile);
} else {
  // apply configuration from environment vars
  const habiticaApiUser = process.env.HABITICA_API_USER;
  const habiticaApiKey = process.env.HABITICA_API_KEY;
  const todoistApiToken = process.env.TODOIST_API_TOKEN;
  if (!!habiticaApiUser && !!habiticaApiKey && !!todoistApiToken) {
    logger.info("Applying configuration from environment variables");
    config = {
      habitica: {
        apiUser: habiticaApiUser,
        apiKey: habiticaApiKey,
      },
      todoist: {
        token: todoistApiToken,
      },
      ignoreProjects: [],
    };
  } else {
    logger.error("No config found!");
  }
}

const Habitica = require("./habitica");
const Todoist = require("./todoist");
const Sync = require("./sync");

const todoist = Todoist.from(config.todoist.token, logger);
const habitica = Habitica.from(
  config.habitica.apiUser,
  config.habitica.apiKey,
  logger
);

const initialSyncToken = process.env.INITIAL_SYNC_TOKEN;
const lastRun =
  jsonFile.readFileSync(configDir + "lastRun.json", { throws: false }) || {};
if (!lastRun.syncToken && !!initialSyncToken) {
  logger.info(`Using initial sync token: ${initialSyncToken}`);
  lastRun.syncToken = initialSyncToken;
}

logger.info("Sync started");
new Sync(todoist, habitica, logger, config)
  .sync(lastRun)
  .then((config) => {
    const sync = config.sync;
    lastRun.syncToken = sync.sync_token;
    logger.info(
      `Sync finished, writing lastRun.json with new syncToken: ${lastRun.syncToken}`
    );
    jsonFile.writeFileSync(configDir + "lastRun.json", lastRun);
  })
  .then(() => logger.info("done"));
