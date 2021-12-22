'use strict';

const expect = require('chai').expect;
const LoggerStub = require('./loggerStub');
const axios = require('axios');
const MockAdapter = require("axios-mock-adapter");

describe('todoist', function () {
    beforeEach(function () {
	console.log('beforeEach');
        const Todoist = require('../todoist');
        this.axios = new MockAdapter(axios);	
        this.todoist = new Todoist(this.axios.axiosInstance);
        const config = require('../config');
    });

    describe('createTask()', function () {
	it('should call the todoist api to create a task', function () {
	    this.axios.onPost('/tasks').reply(200, {
		"comment_count": 0,
		"completed": false,
		"content": "Buy Milk",
		"description": "",
		"due": {
		    "date": "2016-09-01",
		    "datetime": "2016-09-01T11:00:00Z",
		    "recurring": false,
		    "string": "2017-07-01 12:00",
		    "timezone": "Europe/Lisbon"
		},
		"id": 2995104339,
		"order": 1,
		"priority": 4,
		"project_id": 2203306141,
		"section_id": 7025,
		"parent_id": 2995104589,
		"url": "https://todoist.com/showTask?id=2995104339"
	    });
	    const item = {"content": "Buy Milk", "due_string": "tomorrow at 12:00", "due_lang": "en", "priority": 4};
	    return this.todoist.createTask(item).then(response => {
		expect(response.data.content).to.equal('Buy Milk');
	    });
	});
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
