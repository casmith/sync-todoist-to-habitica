'use strict';

const axios = require('axios');
const util = require('util');

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

    async sleep(ms) {
      return new Promise(res => {
        setTimeout(res, ms)
      }) 
    }

    async post(url, form) {
      await this.sleep(2000);
      const res = await this.axios.post(url, form)
      return res.data.data;
    }

    async get(url) {
      await this.sleep(2000);
      const res = await this.axios.get(url);

      return res.data.data;
    }

    async put(url, form) {
      await this.sleep(2000);
      const res = await this.axios.put(url, form);
      return res.data.data;
    }

    async delete(url) {
      await this.sleep(2000);
      const res = await this.axios.delete(url);
      return res.data.data;
    }

    createTask (task) {
        return this.post(`/tasks/user`, task);
    }

    getTask(taskId) {
        return this.get(`/tasks/${taskId}`);
    }

    updateTask (task) {
        return this.put(`/tasks/${task.alias}`, task);
    }

    deleteTask (taskId) {
        return this.delete(`/tasks/${taskId}`).catch(err => {
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
        return this.put(`/tasks/${taskId}/checklist/${itemId}`, {text});
    }

    deleteChecklistItem(taskId, itemId) {
        return this.delete(`/tasks/${taskId}/checklist/${itemId}`);
    }

    scoreChecklistItem(taskId, itemId) {
        return this.post(`/tasks/${taskId}/checklist/${itemId}/score`)
            .catch(e => Promise.reject("failed to score up a task"));
    }
}
