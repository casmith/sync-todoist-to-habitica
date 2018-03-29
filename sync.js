'use strict';

const _ = require('lodash'),
    moment = require('moment'),
    jsonFile = require('jsonfile');

module.exports = class Sync {
    constructor (todoist, habitica, logger) {
        this.priorityMap = {
            1: 0.1,
            2: 1,
            3: 1.5,
            4: 2
        };
        this.habitica = habitica;
        this.logger = logger;
        this.todoist = todoist;        
    }

    checkDailyGoal(config) {
        return this.todoist.getStats()
            .then(stats => {
                const goal = stats.goals.daily_goal;
                const today = moment(stats['days_items'][0].date);
                const completed = stats['days_items'][0].total_completed;
                this.logger.info('Daily goal:', goal, ' Completed:', completed);
                if (completed >= goal && today.isAfter(lastRun.lastDailyGoal, 'd')) {
                    return this.scoreDailyGoalTask(config);
                }
            })
            .then(() => config);
    }

    createHabiticaTask(todoistTask) {
        const todoistDate = todoistTask.due_date_utc;
        const dueDate = todoistDate && moment(todoistDate).format();
        return {
            type: 'todo',
            text: todoistTask.content, 
            alias: todoistTask.id,
            priority: this.priorityMap[todoistTask.priority],
            date: dueDate
        }
    }

    createTask(todoistTask) {
        this.logger.info('Creating new habitica task', todoistTask.content);
        return this.habitica.createTask(this.createHabiticaTask(todoistTask));
    }

    deleteTask(task) {
        this.logger.info('Deleting habitica task', task.content, task.id);
        return this.habitica.deleteTask(task.id)
            .catch(err => {
                if (err.statusCode === 404) {
                    this.logger.warn('Deleting task that no longer exists', task.id);
                } else {
                    return Promise.reject(err);
                }
            });
    }

    filterIgnoredProjects (config) {
        const ignoreProjectIds = config.ignoreProjects.map(projectName => {
            return _.keyBy(config.projects, 'name')[projectName].id
        });
        return function (item) {
            const projectId = item.project_id;
            return !_.includes(ignoreProjectIds, projectId);
        }
    }

    getHabiticaTasks(config) {
        this.logger.info('Getting habitica tasks');
        return this.habitica.listTasks()
            .then(tasks => {
                config.habiticaTasks = tasks;
                config.aliases = _.reduce(tasks, (acc, task) => {
                    acc[task.alias] = task._id;
                    return acc;
                }, {});
            })
            .then(() => {
                return this.habitica.listDailies().then(dailies => {
                    config.habiticaDailies = dailies;
                });
            })
            .then(() => config)
    }

    getProjects(config) {
        return this.todoist.listProjects()
            .then(projects => {
                config.projects = projects;
                return config;
            });
    }

    getSyncData(config, syncToken) {
        return this.todoist.sync(syncToken)
            .then(sync => {
                config.sync = sync;
                return config;
            });
    }

    isTaskRecurring(item) {
        return _.includes(_.toLower(item.date_string), 'every');
    }

    scoreCompletedTasks(config) {
        const sync = config.sync;
        return Promise.all(sync.items
                .filter(item => item.checked)
                .map(item => {
                    this.logger.info('Scoring task', item.id, item.content);
                    return this.habitica.scoreTask(item.id);
                }))
            .then(() => {
                config.items = sync.items.filter(item => !item.checked);
                return config;
            });
    }

    scoreDailyGoalTask(config) {
        const dailyGoalTask = config.habiticaDailies.find(t => t.text === 'Todoist: Daily Goal');
        if (dailyGoalTask) {
            this.logger.info('Daily goal reached! Scoring "Todoist: Daily Goal"');
            lastRun.lastDailyGoal = today;
            return this.habitica.scoreTask(dailyGoalTask._id);
        } else {
            this.logger.info('"Todoist: Daily Goal" task not configured');
        }
    }

    sync(lastRun) {
        const config = require('./config.json');
        lastRun = lastRun || {};
        return this.getHabiticaTasks(config)
            .then(() => this.getProjects(config))
            .then(config => this.getSyncData(config, lastRun.syncToken))
            .then(config => this.scoreCompletedTasks(config))
            .then(config => this.updateTasks(config))
            .then(config => this.checkDailyGoal(config));
    }

    updateTask(todoistTask) {
        this.logger.info('Updating habatica task', todoistTask.id, todoistTask.content);
        return this.habitica.updateTask(this.createHabiticaTask(todoistTask));
    }

    updateTasks(config) {
        const isProjectAllowed = this.filterIgnoredProjects(config);
        return Promise.all(
            config.items
                .filter(isProjectAllowed)
                .filter(t => !this.isTaskRecurring(t))
                .map(item => {
                    const aliases = config.habiticaTasks.map(t => t.alias);
                    if (item.is_deleted) {
                        return this.deleteTask(item);
                    } else if (_.includes(aliases, item.id + '')) {
                        return this.updateTask(item, config.aliases[item.id]);
                    } else {
                        return this.createTask(item);
                    }
                })
        )
            .then(() => config);
    }
}