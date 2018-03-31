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
            return this.habitica.createTask({
                type: 'daily',
                text: 'testing daily',
                frequency: 'monthly'
            }).then(() => {
                this.habitica.listTasks('dailys').then(tasks => console.log(tasks));
            });
        });
    });

    describe('#calculateFrequency()', function () {
        it('is given "every day"', function () {
            expect(this.sync.calculateFrequency('every day')).to.deep.equal({
                frequency: 'daily'
            });
        });
        it('is given "every morning"', function () {
            expect(this.sync.calculateFrequency('every morning')).to.deep.equal({
                frequency: 'daily'
            });
        });
        it('is given "every evening"', function () {
            expect(this.sync.calculateFrequency('every evening')).to.deep.equal({
                frequency: 'daily'
            });
        });
        it('is given "every weekday"', function () {
            expect(this.sync.calculateFrequency('every weekday')).to.deep.equal({
                frequency: 'weekly',
                repeat: {
                    su: false,
                    m: true,
                    t: true,
                    w: true,
                    th: true,
                    f: true,
                    s: false
                }
            });
        });
        it('is given "every week"', function () {
            expect(this.sync.calculateFrequency('every week')).to.deep.equal({
                frequency: 'weekly'
            });
        });
        it('is given "weekly"', function () {
            expect(this.sync.calculateFrequency('weekly')).to.deep.equal({
                frequency: 'weekly'
            });
        });
        it('is given "every month"', function () {
            expect(this.sync.calculateFrequency('every month')).to.deep.equal({
                frequency: 'monthly'
            });
        });
        it('is given "monthly"', function () {
            expect(this.sync.calculateFrequency('monthly')).to.deep.equal({
                frequency: 'monthly'
            });
        });

        it('is given "every year"', function () {
            expect(this.sync.calculateFrequency('every year')).to.deep.equal({
                frequency: 'yearly'
            });
        });
        it('is given "yearly"', function () {
            expect(this.sync.calculateFrequency('yearly')).to.deep.equal({
                frequency: 'yearly'
            });
        });

        it('is given "every monday, friday"');
        it('is given "every 3 days"');
        it('is given "every 3rd friday"');
        it('is given "every 27th"');
        it('is given "every jan 27th"');
        it('is given "every other monday"');
    });
});
