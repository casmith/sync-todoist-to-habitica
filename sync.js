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

    return habitica.listTasks()
        // .then(tasks => habitica.deleteTasks(tasks.map(task => task._id)))
        .then(() => todoist.sync(lastRun.syncToken))
        .then(sync => {
            lastRun.syncToken = sync.sync_token;
            jsonFile.writeFileSync('lastRun.json', lastRun);
            console.log(JSON.stringify(sync.items));

            const scorePromises = Promise.all(sync.items
                .filter(item => item.checked)
                .map(item => habitica.scoreTask(item.id)));

            return sync.items.filter(item => !item.checked);
        })
        .then((items) => {
            items
                // remove "recurring" tasks for the sake of "todos"
                .filter(item => !_.includes(item.date_string, 'every'))
                .map(item => {
                    return {
                        content: item.content, 
                        alias: item.id,
                        priority: priorityMap[item.priority]
                    };
                })
                .map(task => habitica.createTask(task));
        });

    // return todoist.sync()
    //     .then(s => {
    //         console.log(s);
    //     })
    //     .then(() => {
    //         return todoist.getTask('2217245619')
    //             .then(t => console.log(t));
    //     });
}