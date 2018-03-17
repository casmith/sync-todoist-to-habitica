'use strict';

const _ = require('lodash');
const moment = require('moment');
const winston = require('winston');
const config = require('./config.json');

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

new Sync(todoist, habitica, logger)
	.sync()
	.then(() => console.log('done'));


// Promise.all([habitica.listTasks(), todoist.listTasks()])
// 	.then(([habiticaTasks, todoistTasks]) => {
// 		const map = _.keyBy(todoistTasks, 'id');

// 		// console.log(todoistTasks);
// 		habiticaTasks.filter(t => _.get(map[t.alias], 'completed'))
// 			.forEach(t => console.log('completed ', t.text));

// 		habiticaTasks.forEach(t => {
// 			console.log('t.alias', t.alias)
// 			todoist.getTask(t.alias)
// 				.then(t2 => {
// 					if (t2.completed) {
// 						console.log('completed!');
// 					}
// 				})
// 				.catch(e => console.log(t.alias, e));
// 		});
// 	});


// todoist.getTask('2539198988');
// copy tasks from todoist to habitica
/*
todoist.listTasks()
 .then(tasks => {
  const promises = _.filter(tasks, task => task.indent === 1)
   .map(task => {
    return {
     alias: task.id,
     content: task.content,
     priority: priorityMap[task.priority]
    };
   })
   .map(task => habitica.createTask(task));

  Promise.all(promises)
   .then(results => console.log('done'))
   .catch(err => console.error(err));
 });
*/