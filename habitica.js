'use strict';

const axios = require('axios');

module.exports = class Habitica {

    constructor (myAxios, logger = console) {
	    this.logger = logger;
        this.axios = myAxios;
    }
    
    static from(apiUser, apiKey, logger = console) {
        const headers = {
            ['x-api-user']: apiUser,
            ['x-api-key']: apiKey
        };
        const baseURL = "https://habitica.com/api/v3/";
        const newAxios = axios.create({headers, baseURL});
        return new Habitica(newAxios, logger);
    }

    post(url, form) {
        return this.axios.post(url, form)
            .then(res => res.data);
    }

    get(url) {
        return this.axios.get(url)
            .then(response => response.data);
    }

    createTask (task) {
        return this.post(`/tasks/user`, task);
    }

    getTask(taskId) {
        return this.get(`/tasks/${taskId}`);
    }

    updateTask (task) {
        return this.axios.put(`/tasks/${task.alias}`, task);
    }

    deleteTask (taskId) {
        return this.axios.delete(`/tasks/${taskId}`).catch(err => {
            if (err.response.status === 404) {
                this.logger.warn('Deleting task that no longer exists', taskId);
            } else {
                return Promise.reject(err);
            }
        });
    }

    deleteAllTasks(type) {
        return this.listTasks(type)
            .then(tasks => Promise.all(tasks.map(t => this.deleteTask(t._id))));
    }

    deleteTasks (taskIds) {
        return Promise.all(taskIds.map(taskId => this.deleteTask(taskId)));
    }

    listTasks(type = 'todos') {
        return this.get('/tasks/user' + (type ? `?type=${type}` : ''))
            .then(response => response.data);
    }

    listDailies() {
        return this.listTasks('dailys');
    }

    scoreTask (taskId) {
        return this.post(`/tasks/${taskId}/score/up`);
    }

    createChecklistItem(taskId, text) {
        return this.post(`/tasks/${taskId}/checklist`, text);
    }

    updateChecklistItem(taskId, itemId, text) {
        return this.axios.put(`/tasks/${taskId}/checklist/${itemId}`, {text});
    }

    deleteChecklistItem(taskId, itemId) {
        return this.axios.delete(`/tasks/${taskId}/checklist/${itemId}`);
    }

    scoreChecklistItem(taskId, itemId) {
        return this.post(`/tasks/${taskId}/checklist/${itemId}/score`)
            .catch(e => Promise.reject("failed to score up a task"));
    }
}
