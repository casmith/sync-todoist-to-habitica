'use strict';

const request = require('request-promise');

module.exports = class {

    constructor (apiUser, apiKey, logger) {
        this.apiUser = apiUser;
        this.apiKey = apiKey;
	this.logger = logger;
        const headers = {
            ['x-api-user']: this.apiUser,
            ['x-api-key']: this.apiKey
        };
        this.request = request.defaults({headers});
    }

    post(url, form) {
        return this.request.post({url, form, json: true})
            .then(res => res.data);
    }

    createTask (task) {
        return this.post(`https://habitica.com/api/v3/tasks/user`, task);
    }

    getTask(taskId) {
        return this.request.get({
            url: `https://habitica.com/api/v3/tasks/${taskId}`
        });
    }

    updateTask (task) {
        return this.request.put({
            url: `https://habitica.com/api/v3/tasks/${task.alias}`,
            form: task
        });
    }

    deleteTask (taskId) {
        return this.request.delete({
            url: 'https://habitica.com/api/v3/tasks/' + taskId,
        });
    }

    deleteAllTasks(type) {
        return this.listTasks(type)
            .then(tasks => Promise.all(tasks.map(t => this.deleteTask(t._id))));
    }

    deleteTasks (taskIds) {
        return Promise.all(taskIds.map(taskId => this.deleteTask(taskId)));
    }

    listTasks(type) {
        if (!type) {
            type = 'todos';
        }
        return this.request.get({
            url: 'https://habitica.com/api/v3/tasks/user' + (type ? `?type=${type}` : '')
        })
        .then(response => JSON.parse(response).data);
    }

    listDailies() {
        return this.listTasks('dailys');
    }

    userCast () {
    }

    scoreTask (taskId) {
        return this.request.post({
            url: `https://habitica.com/api/v3/tasks/${taskId}/score/up`
        });
    }

    createChecklistItem(taskId, text) {
        return this.request.post({
            url: `https://habitica.com/api/v3/tasks/${taskId}/checklist`,
            form: {text}
        });
    }

    updateChecklistItem(taskId, itemId, text) {
        return this.request.put({
            url: `https://habitica.com/api/v3/tasks/${taskId}/checklist/${itemId}`,
            form: {text}
        });
    }

    deleteChecklistItem(taskId, itemId) {
        return this.request.delete({
            url: `https://habitica.com/api/v3/tasks/${taskId}/checklist/${itemId}`
        });
    }

    scoreChecklistItem(taskId, itemId) {
        return this.request.post({
            url: `https://habitica.com/api/v3/tasks/${taskId}/checklist/${itemId}/score`
        }).catch(e => Promise.reject("failed to score up a task"));
    }
}
