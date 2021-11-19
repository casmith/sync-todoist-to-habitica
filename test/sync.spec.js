'use strict';

const expect = require('chai').expect;
const LoggerStub = require('./loggerStub');
const sinon = require('sinon');
const { v4: uuidv4 } = require('uuid');

class FakeHabitica {
    constructor() {
        this.tasks = [];
        this.dailies = [
            {
                _id: uuidv4(),
                text: "Todoist: Daily Goal"
            }
        ]
    }
    async listTasks() {
        return [].concat(this.tasks).concat(this.dailies);
    }
    listDailies() {
        return Promise.resolve(this.dailies);
    }
    createTask(task) {
        if (!task) throw new Error('empty task');
        this.tasks.push(task);
        return Promise.resolve();
    }
    scoreTask(id) {
        return this.listTasks().then(tasks => {
            const task = tasks.find(t => t._id === id || t.alias === id);
            if (task) task.checked = true;
        });
    }
}


function statsFor(goal, completed) {
    return {
            goals: {
                daily_goal: goal
            },
            days_items: [{
              total_completed: completed
            }]
        };
}

describe('sync', function () {
    beforeEach(function () {
        const Todoist = require('../todoist');
        this.logger = new LoggerStub();
        this.habitica = new FakeHabitica();
        const Sync = require('../sync');
        const config = require('../config');
        const todoist = new Todoist(config.todoist.token, this.logger);
        this.todoist = {
            getStats() {},
            listProjects() {},
            listTasks() {},
            sync() {},
        }
        this.sync = new Sync(this.todoist, this.habitica, this.logger, config);
        this.todoist.isTaskRecurring = todoist.isTaskRecurring;
        sinon.stub(this.todoist, 'listProjects').returns(Promise.resolve());
    });

    it('syncs a new task to habitica', async function () {
        sinon.stub(this.todoist, 'getStats').returns(Promise.resolve(statsFor(6, 0)));
        const tasks = {items: [{id: uuidv4(), checked: false, content: "My task"}]};
        sinon.stub(this.todoist, 'sync').returns(Promise.resolve(tasks))
        sinon.stub(this.todoist, 'listTasks').returns(Promise.resolve(tasks.items));
        
        const originalTasks = await this.habitica.listTasks();
        await this.sync.sync({})
        const newTasks = await this.habitica.listTasks();
        expect(newTasks).to.have.lengthOf(originalTasks.length + 1);
    });

    it('scores the daily task in habitica when the todooist daily goal is reached', async function () {
        sinon.stub(this.todoist, 'getStats').returns(Promise.resolve(statsFor(6, 6)));
        const tasks = {items: [{id: uuidv4(), checked: false, content: "My task"}]};
        sinon.stub(this.todoist, 'sync').returns(Promise.resolve(tasks))
        sinon.stub(this.todoist, 'listTasks').returns(Promise.resolve(tasks.items));
        
        const originalTasks = await this.habitica.listTasks();
        await this.sync.sync({})
        const newTasks = await this.habitica.listTasks();
        const task = newTasks.find(t => t.text == 'Todoist: Daily Goal'); 
        expect(task.checked).to.equal(true);
    });

    // Pending tests: 

    // delete task
    // add subtasks as checklist items
    // scoring of checklist items
    // unscoring of checklist items
    // unscoring of a task
    // scoring daily/recurring tasks
    // skipping projets
    
});
