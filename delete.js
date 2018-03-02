
const config = require('./config.json');
const Habitica = require('./habitica');
const habitica = new Habitica(config.habitica.apiUser, config.habitica.apiKey);

habitica.listTasks()
	.then(tasks => {
		// return console.log(tasks)
		return Promise.all(tasks.map(task => habitica.deleteTask(task._id)));
	})
	.then(() => console.log('done'));