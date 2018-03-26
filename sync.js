'use strict';

const _ = require('lodash'),
    moment = require('moment'),
    jsonFile = require('jsonfile');

module.exports = function (todoist, habitica, logger) {

    const priorityMap = {
        1: 0.1,
        2: 1,
        3: 1.5,
        4: 2
    };

    const config = require('./config.json');

    this.createTask = function (todoistTask) {
        logger.info('Creating new habitica task', todoistTask.content);
        return habitica.createTask(this.createHabiticaTask(todoistTask));
    }

    this.updateTask = function (todoistTask) {
        logger.info('Updating habatica task', todoistTask.id, todoistTask.content);
        return habitica.updateTask(this.createHabiticaTask(todoistTask));
    }

    this.createHabiticaTask = function (todoistTask) {
        const todoistDate = todoistTask.due_date_utc;
        const dueDate = todoistDate && moment(todoistDate).format();
        return {
            type: 'todo',
            text: todoistTask.content, 
            alias: todoistTask.id,
            priority: priorityMap[todoistTask.priority],
            date: dueDate
        }
    }

    this.deleteTask = function (task) {
        logger.info('Deleting habitica task', task.content, task.id);
        return habitica.deleteTask(task.id)
            .catch(err => {
                if (err.statusCode === 404) {
                    logger.warn('Deleting task that no longer exists', task.id);
                } else {
                    return Promise.reject(err);
                }
            });
    }

    this.getSyncData = function (config, syncToken) {
        return todoist.sync(syncToken)
            .then(sync => {
                config.sync = sync;
                return config;
            });
    };

    this.getHabiticaTasks = function (config) {
        logger.info('Getting habitica tasks');
        return habitica.listTasks()
            .then(tasks => {
                config.habiticaTasks = tasks;
                config.aliases = _.reduce(tasks, (acc, task) => {
                    acc[task.alias] = task._id;
                    return acc;
                }, {});
            })
            .then(() => {
                return habitica.listDailies().then(dailies => {
                    config.habiticaDailies = dailies;
                });
            })
            .then(() => config)
    }

    this.getProjects = function (config) {
        return todoist.listProjects()
            .then(projects => {
                config.projects = projects;
                return config;
            });
    };

    this.isTaskRecurring = function (item) {
        return !_.includes(item.date_string, 'every');
    };

    this.filterIgnoredProjects = function (config) {
        const ignoreProjectIds = config.ignoreProjects.map(projectName => {
            return _.keyBy(config.projects, 'name')[projectName].id
        });
        return function (item) {
            const projectId = item.project_id;
            return !_.includes(ignoreProjectIds, projectId);
        }
    }

    this.scoreDailyGoalTask = function(config) {
        const dailyGoalTask = config.habiticaDailies.find(t => t.text === 'Todoist: Daily Goal');
        if (dailyGoalTask) {
            logger.info('Daily goal reached! Scoring "Todoist: Daily Goal"');
            lastRun.lastDailyGoal = today;
            return habitica.scoreTask(dailyGoalTask._id);
        } else {
            logger.info('"Todoist: Daily Goal" task not configured');
        }
    }

    this.sync = function (lastRun) {
        lastRun = lastRun || {};
        return this.getHabiticaTasks(config)
            .then(() => this.getProjects(config))
            .then(config => this.getSyncData(config, lastRun.syncToken))
            .then(config => {
                const sync = config.sync;
                return Promise.all(sync.items
                    .filter(item => item.checked)
                    .map(item => habitica.scoreTask(item.id)))
                .then(() => {
                    config.items = sync.items.filter(item => !item.checked);
                    return config;
                });
            })
            .then(config => {
                const isProjectAllowed = this.filterIgnoredProjects(config);
                return Promise.all(config.items
                        .filter(isProjectAllowed)
                        .filter(this.isTaskRecurring)
                        .map(item => {
                            const aliases = config.habiticaTasks.map(t => t.alias);
                            if (item.is_deleted) {
                                return this.deleteTask(item);
                            } else if (_.includes(aliases, item.id + '')) {
                                return this.updateTask(item, config.aliases[item.id]);
                            } else {
                                return this.createTask(item);
                            }
                        }))
                    .then(() => config);
            })
            .then(config => {
                return todoist.getStats()
                    .then(stats => {
                        const goal = stats.goals.daily_goal;
                        const today = moment(stats['days_items'][0].date);
                        const completed = stats['days_items'][0].total_completed;
                        logger.info('Daily goal:', goal, ' Completed:', completed);
                        if (completed >= goal && today.isAfter(lastRun.lastDailyGoal, 'd')) {
                            return this.scoreDailyGoalTask(config);
                        }
                    }).then(() => config);
            });
    };
}