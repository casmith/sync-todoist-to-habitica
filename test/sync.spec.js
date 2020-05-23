'use strict';

const expect = require('chai').expect;
const LoggerStub = require('./loggerStub');

describe('sync', function () {
    before(function () {
        const config = require('../config');
        const Todoist = require('../todoist');
        const Habitica = require('../habitica');
        const Sync = require('../sync');
        const logger = new LoggerStub();
        this.todoist = new Todoist(config.todoist.token, logger);
        this.habitica = new Habitica(config.habitica.apiUser, config.habitica.apiKey);
        this.sync = new Sync(this.todoist, this.habitica, logger);
    });

    describe.skip('integration', function () {
        it('all tasks are deleted in todoist', function () {
            return this.todoist.deleteAllTasks();
        });

        it('all tasks are deleted in habitica', function () {
            return this.habitica.deleteAllTasks('dailys');
        });

        it('habitica has no tasks', function () {
            return this.habitica.listTasks().then(tasks => expect(tasks.length).to.equal(0));
        });

        it('adds a task to todoist and syncs', function () {
            return this.todoist.createTask({content: 'Test adding a task'});
        });

        it('syncs the new task', function () {
            return this.sync.sync();
        });

        it('adds a recurring task in todoist', function () {
            return this.todoist.createTask({
                content: 'Test adding a recurring task',
                due_string: 'every monday'
            });
        });

        it('syncs the new task', function () {
            return this.sync.sync();
        });

        it('creates a daily in habitica', function () {
            // return this.habitica.createTask({
            //     type: 'daily',
            //     text: 'testing daily',
            //     frequency: 'monthly',
            // }).then(() => {
                this.todoist.listTasks().then(tasks => console.log(tasks));
                // this.habitica.listTasks('dailys').then(tasks => console.log(tasks));
            // });
        });
    });
});
