'use strict';

const request = require('request-promise');

module.exports = class {

    constructor(apiToken, logger) {
        this.apiToken = apiToken;
        this.request = request.defaults({
            headers: {
                'Authorization': 'Bearer ' + this.apiToken
            }
        });
        this.logger = logger;
    }

    getStats() {
        return this.request.get('https://todoist.com/api/v7/completed/get_stats')
            .then(r => JSON.parse(r));
    }

    getTask(taskId) {
        return this.request.get(`https://beta.todoist.com/API/v8/tasks/${taskId}`)
            .then(r => JSON.parse(r)); 
    }

    listProjects() {
        return this.request.get('https://beta.todoist.com/API/v8/projects')
            .then(r => JSON.parse(r));
    }


    listTasks() {
        return this.request.get('https://beta.todoist.com/API/v8/tasks')
            .then(r => JSON.parse(r));
    }

    sync(token) {
        const url = 'https://todoist.com/api/v7/sync?resource_types=["all"]&sync_token=' + token;
        this.logger.info('Sync Token:', token);
        return this.request.get({
                url: url
            })
            .then(r => JSON.parse(r));
    }
}