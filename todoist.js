'use strict';

const _ = require('lodash');
const request = require('request-promise');
const uuidv4 = require('uuid/v4');
const baseUrl = 'https://api.todoist.com/rest/v1';

const REPEAT_WEEKDAYS = {
    su: false,
    m: true,
    t: true,
    w: true,
    th: true,
    f: true,
    s: false
};

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

    createTask(item) {
        return this.request.post({
            url: `${baseUrl}/tasks`, 
            body: JSON.stringify(item),
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    deleteTask(id) {
        return this.request.delete(`${baseUrl}/tasks/${id}`);
    }

    deleteAllTasks() {
        return this.listTasks().then(items => Promise.all(items.map(i => this.deleteTask(i.id))));
    }

    getStats() {
        return this.request.get('https://api.todoist.com/sync/v8/completed/get_stats')
            .then(r => JSON.parse(r));
    }

    getTask(taskId) {
        return this.request.get(`${baseUrl}/tasks/${taskId}`)
            .then(r => JSON.parse(r)); 
    }

    isTaskRecurring(task) {
        return _.get(task, 'due.is_recurring', false);
    }

    listProjects() {
        return this.request.get(`${baseUrl}/projects`)
            .then(r => JSON.parse(r));
    }


    listTasks() {
        return this.request.get(`${baseUrl}/tasks`)
            .then(r => {
                this.logger.info("Done fetching all todoist tasks");
                return JSON.parse(r)
            });
    }

    sync(token) {
        const url = 'https://api.todoist.com/sync/v8/sync?resource_types=["all"]&sync_token=' + token;
        this.logger.info('Sync Token:', token);
        return this.request.get({
                url: url
            })
            .then(r => JSON.parse(r));
    }

    calculateFrequency(dateExpr) {
        if (dateExpr.includes('weekday')) {
            return {
                frequency: 'weekly',
                repeat: REPEAT_WEEKDAYS
            }
        }

        if (dateExpr === 'every week' || dateExpr === 'weekly') {
            return {
                frequency: 'weekly'
            }
        }


        if (dateExpr.startsWith('every other')) {
            const dayExpr = dateExpr.substr(12).trim();
            return {
                everyX: 2,
                frequency: 'weekly',
                repeat: this.getRepeat(this.getDay(dayExpr))
            }
        }

        if (dateExpr === 'every month' || dateExpr === 'monthly') {
            return {
                frequency: 'monthly'
            }
        }

        if (dateExpr === 'every year' || dateExpr === 'yearly') {
            return {
                frequency: 'yearly'
            }
        }

        return {
            frequency: 'daily'
        }
    }

    getDay(dayExpr) {
        switch(_.toLower(dayExpr)) {
            case 'monday':
            case 'mon':
            case 'm':
                return 'm';
            case 'tuesday':
            case 'tues':
            case 'tue':
            case 't':
                return 't';
            case 'wednesday':
            case 'wed':
            case 'w':
                return 'w';
            case 'thursday':
            case 'thurs':
            case 'th':
                return 'th';
            case 'friday':
            case 'fri':
            case 'f':
                return 'f';
        }
    }

    getRepeat(day) {
        const repeat = {
            su: false,
            m: false,
            t: false,
            w: false,
            th: false,
            f: false,
            s: false
        }
        repeat[day] = true;
        return repeat;
    }
}