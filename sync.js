'use strict';

module.exports = function (todoist, habitica, logger) {

    const _ = require('lodash'),
        moment = require('moment'),
        jsonFile = require('jsonfile');

    const priorityMap = {
        1: 0.1,
        2: 1,
        3: 1.5,
        4: 2
    };

    const lastRun = jsonFile.readFileSync('lastRun.json', {throws: false}) || {};

    const config = require('./config.json');

    const createTask = function (todoistTask) {
        return habitica.createTask(createHabiticaTask(todoistTask));
    }

    const updateTask = function (todoistTask) {
        return habitica.updateTask(createHabiticaTask(todoistTask));
    }

    const createHabiticaTask = function (todoistTask) {
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

    const deleteTask = function (taskId) {
        return habitica.deleteTask(taskId);
    }

    const getSyncData = function (config, syncToken) {
        return todoist.sync(syncToken)
            .then(sync => {
                config.sync = sync;
                return config;
            });
    };

    const getHabiticaTasks = function (config) {
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

    const getProjects = function (config) {
        return todoist.listProjects()
            .then(projects => {
                config.projects = projects;
                return config;
            });
    };

    const isTaskRecurring = function (item) {
        return !_.includes(item.date_string, 'every');
    };

    const filterIgnoredProjects = function (config) {
        const ignoreProjectIds = config.ignoreProjects.map(projectName => {
            return _.keyBy(config.projects, 'name')[projectName].id
        });
        return function (item) {
            const projectId = item.project_id;
            return !_.includes(ignoreProjectIds, projectId);
        }
    }

    const scoreDailyGoalTask = function(config) {
        const dailyGoalTask = config.habiticaDailies.find(t => t.text === 'Todoist: Daily Goal');
        if (dailyGoalTask) {
            logger.info('Daily goal reached! Scoring "Todoist: Daily Goal"');
            lastRun.lastDailyGoal = today;
            return habitica.scoreTask(dailyGoalTask._id);
        } else {
            logger.info('"Todoist: Daily Goal" task not configured')
        }
    }


    this.sync = function () {
        return getHabiticaTasks(config)
        .then(() => getProjects(config))
        .then(config => getSyncData(config, lastRun.syncToken))
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
            const isProjectAllowed = filterIgnoredProjects(config);
            return Promise.all(config.items
                    .filter(isProjectAllowed)
                    .filter(isTaskRecurring)
                    .map(item => {
                        const aliases = config.habiticaTasks.map(t => t.alias);
                        if (item.is_deleted) {
                            return deleteTask(item.id);
                        } else if (_.includes(aliases, item.id + '')) {
                            return updateTask(item, config.aliases[item.id]); 
                        } else {
                            return createTask(item);
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
                        return scoreDailyGoalTask(config);
                    }
                }).then(() => config);
        })
        .then(config => {
            const sync = config.sync;
            lastRun.syncToken = sync.sync_token;
            jsonFile.writeFileSync('lastRun.json', lastRun);
        });
    };
}