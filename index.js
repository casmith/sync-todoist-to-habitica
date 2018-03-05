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

require('./sync')(todoist, habitica)
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