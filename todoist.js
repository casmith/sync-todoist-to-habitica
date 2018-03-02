'use strict';

const request = require('request');

module.exports = class {
	constructor(apiToken) {
		this.apiToken = apiToken;
	}

	listTasks() {
		return new Promise((resolve, reject) => {
			request.get({
				url: 'https://beta.todoist.com/API/v8/tasks', 
				headers: {
					'Authorization': 'Bearer ' + this.apiToken
				}
			}, (err, res) => {
				if (err) {
					reject(err);
				} else {
					resolve(JSON.parse(res.body));
				}
			});	
		});
	}
}