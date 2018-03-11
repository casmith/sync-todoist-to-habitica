'use strict';

const request = require('request-promise');

module.exports = class {

    constructor (apiUser, apiKey) {
        this.apiUser = apiUser;
        this.apiKey = apiKey;
        const headers = {
            ['x-api-user']: this.apiUser,
            ['x-api-key']: this.apiKey
        };
        this.request = request.defaults({headers});
    }

    createTask (task) {
        return this.request.post({
            url: `https://habitica.com/api/v3/tasks/user`,
            form: {
                type: 'todo',
                text: task.content,
                alias: task.alias,
                priority: task.priority
            }
        });
    }

    getTask(taskId) {
        return this.request.get({
            url: `https://habitica.com/api/v3/tasks/${taskId}`
        }).catch((e) => {
            console.log('oh')
            return Promise.reject(e);
        });
    }

    updateTask (task) {
        return this.request.put({
            url: `https://habitica.com/api/v3/tasks/${task.alias}`,
            form: {
                text: task.content,
                priority: task.priority
            }
        });
    }

    deleteTask (taskId) {
        return this.request.delete({
            url: 'https://habitica.com/api/v3/tasks/' + taskId,
        });
    }

    deleteTasks (taskIds) {
        return Promise.all(taskIds.map(taskId => this.deleteTask(taskId)));
    }

    listTasks() {
        return this.request.get({
            url: 'https://habitica.com/api/v3/tasks/user?type=todos'
        })
        .then(response => JSON.parse(response).data);
    }

    userCast () {
    }

    scoreTask (taskId) {
        return this.request.post({
            url: `https://habitica.com/api/v3/tasks/${taskId}/score/up`
        });
    }
}