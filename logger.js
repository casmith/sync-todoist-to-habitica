'use strict';

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

module.exports = (configDir) => {
    return createLogger({
        format: combine(
            timestamp(),
            myFormat
        ),
        transports: [new transports.Console(), new transports.File({filename: configDir + "sync.log" })]
    });
};

