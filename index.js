'use strict';

const priorityMap = {
	1: 0.1,
 	2: 1,
 	3: 1.5,
 	4: 2
};

const _ = require('lodash');
const config = require('./config.json');

const Todoist = require('./todoist');
const todoist = new Todoist(config.todoist.token);

const Habitica = require('./habitica');
const habitica = new Habitica(config.habitica.apiUser, config.habitica.apiKey);

// copy tasks from todoist to habitica
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
