'use strict';

module.exports = function (todoist, habitica) {

    const _ = require('lodash'),
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

    const createHabiticaTask = function (todoistTask) {
        return {
            content: todoistTask.content, 
            alias: todoistTask.id,
            priority: priorityMap[todoistTask.priority]
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

    return habitica.listTasks()
        //.then(tasks => tasks.map(task => habitica.deleteTask(task._id)))
        .then(() => getProjects(config))
        .then(config => getSyncData(config, lastRun.syncToken))
        .then(config => {
            const sync = config.sync;
            console.log(sync)
            const scorePromises = Promise.all(sync.items
                .filter(item => item.checked)
                .map(item => habitica.scoreTask(item.id)));

            config.items = sync.items.filter(item => !item.checked);
            return config;
        })
        .then(config => {
            const isProjectAllowed = filterIgnoredProjects(config);
            config.items
                .filter(isProjectAllowed)
                .filter(isTaskRecurring)
                .map(item => {
                    if (item.is_deleted) {
                        return deleteTask(item.id);
                    } else {
                        return createTask(item);
                    }
                });
            return config;
        })
        .then(config => {
            const sync = config.sync;
            lastRun.syncToken = sync.sync_token;
            jsonFile.writeFileSync('lastRun.json', lastRun);
        })
        .catch(e => console.error(e));
}