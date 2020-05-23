'use strict';

const expect = require('chai').expect;
const LoggerStub = require('./loggerStub');

describe('todoist', function () {
	before(function () {
        const config = require('../config');
        const Todoist = require('../todoist');
        const logger = new LoggerStub();
        this.todoist = new Todoist(config.todoist.token, logger);
    });
	describe('#calculateFrequency()', function () {
        it('is given "every day"', function () {
            expect(this.todoist.calculateFrequency('every day')).to.deep.equal({
                frequency: 'daily'
            });
        });
        it('is given "every morning"', function () {
            expect(this.todoist.calculateFrequency('every morning')).to.deep.equal({
                frequency: 'daily'
            });
        });
        it('is given "every evening"', function () {
            expect(this.todoist.calculateFrequency('every evening')).to.deep.equal({
                frequency: 'daily'
            });
        });
        it('is given "every weekday"', function () {
            expect(this.todoist.calculateFrequency('every weekday')).to.deep.equal({
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
            expect(this.todoist.calculateFrequency('every week')).to.deep.equal({
                frequency: 'weekly'
            });
        });
        it('is given "weekly"', function () {
            expect(this.todoist.calculateFrequency('weekly')).to.deep.equal({
                frequency: 'weekly'
            });
        });
        it('is given "every month"', function () {
            expect(this.todoist.calculateFrequency('every month')).to.deep.equal({
                frequency: 'monthly'
            });
        });
        it('is given "monthly"', function () {
            expect(this.todoist.calculateFrequency('monthly')).to.deep.equal({
                frequency: 'monthly'
            });
        });

        it('is given "every year"', function () {
            expect(this.todoist.calculateFrequency('every year')).to.deep.equal({
                frequency: 'yearly'
            });
        });
        it('is given "yearly"', function () {
            expect(this.todoist.calculateFrequency('yearly')).to.deep.equal({
                frequency: 'yearly'
            });
        });

        it('is given "every monday, friday"');
        it('is given "every 3 days"');
        it('is given "every 3rd friday"');
        it('is given "every 27th"');
        it('is given "every jan 27th"');
        it('is given "every other monday"', function () {
            expect(this.todoist.calculateFrequency('every other monday')).to.deep.equal({
                frequency: 'weekly',
                everyX: 2,
                repeat: {
                    su: false,
                    m: true,
                    t: false,
                    w: false,
                    th: false,
                    f: false,
                    s: false
                }
            });
        });
    });
	
});