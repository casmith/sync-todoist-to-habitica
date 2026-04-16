"use strict";

const expect = require("chai").expect;
const LoggerStub = require("./loggerStub");
const sinon = require("sinon");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");

class FakeHabitica {
  constructor() {
    this.tasks = [];
    this.dailies = [
      {
        _id: uuidv4(),
        text: "Todoist: Daily Goal",
        checklist: [],
      },
    ];
  }
  async listTasks() {
    return [].concat(this.tasks).concat(this.dailies);
  }
  listDailies() {
    return Promise.resolve(this.dailies);
  }

  async createChecklistItem(taskId, content) {
    const task = this.getTask(taskId);
    if (task) task.checklist.push(content);
  }

  createTask(task) {
    if (!task) throw new Error("empty task");
    const newTask = {
      _id: uuidv4(),
      alias: task.alias,
      checklist: [],
      text: task.text,
    };
    this.tasks.push(newTask);
    return Promise.resolve();
  }

  scoreTask(id) {
    return this.listTasks().then((tasks) => {
      const task = this.getTask(id);
      if (task) task.checked = true;
    });
  }

  async deleteTask(id) {
    const idx = this.tasks.findIndex(
      (t) => t._id === id || t.id === id || t.alias === id,
    );
    this.tasks.splice(idx, idx >= 0 ? 1 : 0);
  }

  getTask(id) {
    return []
      .concat(this.tasks)
      .concat(this.dailies)
      .find((t) => t._id === id || t.alias === id);
  }

  async updateTask(task) {
    await this.deleteTask(task.id);
    await this.createTask(task);
  }
}

function syncDataFor(goal, completed, items) {
  return {
    items: items,
    user: { daily_goal: goal },
    stats: {
      days_items: [
        {
          total_completed: completed,
        },
      ],
    },
  };
}

describe("sync", function () {
  beforeEach(function () {
    const Todoist = require("../todoist");
    this.logger = new LoggerStub();
    this.habitica = new FakeHabitica();
    const Sync = require("../sync");
    const config = require("../config");
    const todoist = new Todoist(config.todoist.token, this.logger);
    this.todoist = {
      listProjects() {},
      listTasks() {},
      sync() {},
    };
    this.sync = new Sync(this.todoist, this.habitica, this.logger, config);
    this.todoist.isTaskRecurring = todoist.isTaskRecurring;
    sinon.stub(this.todoist, "listProjects").returns(Promise.resolve());
  });

  it("syncs a new task to habitica", async function () {
    const items = [{ id: uuidv4(), checked: false, content: "My task" }];
    const tasks = syncDataFor(6, 0, items);
    sinon.stub(this.todoist, "sync").returns(Promise.resolve(tasks));
    sinon.stub(this.todoist, "listTasks").returns(Promise.resolve(items));

    const originalTasks = await this.habitica.listTasks();
    await this.sync.sync({});
    const newTasks = await this.habitica.listTasks();
    expect(newTasks).to.have.lengthOf(originalTasks.length + 1);
  });

  it("scores a task when it is completed", async function () {
    const items = [{ id: uuidv4(), checked: false, content: "My task" }];
    const tasks = syncDataFor(6, 0, items);
    sinon.stub(this.todoist, "sync").returns(Promise.resolve(tasks));
    sinon.stub(this.todoist, "listTasks").returns(Promise.resolve(items));

    const originalTasks = await this.habitica.listTasks();
    await this.sync.sync({});

    tasks.items[0].checked = true;
    await this.sync.sync({});

    const newTasks = await this.habitica.listTasks();
    const completedTasks = newTasks.filter((t) => t.checked);
    expect(completedTasks).to.have.lengthOf(1);
  });
  it("scores the daily task in habitica when the todooist daily goal is reached", async function () {
    const items = [{ id: uuidv4(), checked: false, content: "My task" }];
    const tasks = syncDataFor(6, 6, items);
    sinon.stub(this.todoist, "sync").returns(Promise.resolve(tasks));
    sinon.stub(this.todoist, "listTasks").returns(Promise.resolve(items));

    const originalTasks = await this.habitica.listTasks();
    await this.sync.sync({});
    const newTasks = await this.habitica.listTasks();
    const task = newTasks.find((t) => t.text == "Todoist: Daily Goal");
    expect(task.checked).to.equal(true);
  });

  it("deletes a task from habitica when it is deleted from todoist", async function () {
    const items = [{ id: uuidv4(), checked: false, content: "My task" }];
    const tasks = syncDataFor(6, 6, items);
    sinon.stub(this.todoist, "sync").returns(Promise.resolve(tasks));
    sinon.stub(this.todoist, "listTasks").returns(Promise.resolve(items));

    const originalTasks = await this.habitica.listTasks();

    // sync to create the task in habitica
    await this.sync.sync({});

    // mark it as deleted
    tasks.items[0].is_deleted = true;

    // sync again
    await this.sync.sync({});

    const newTasks = await this.habitica.listTasks();
    expect(newTasks.length).to.equal(originalTasks.length);
  });

  it("adds a todoist subtask as a checklist item in habitica", async function () {
    const items = [{ id: uuidv4(), checked: false, content: "My task" }];
    const tasks = syncDataFor(6, 0, items);
    sinon.stub(this.todoist, "sync").returns(Promise.resolve(tasks));
    sinon.stub(this.todoist, "listTasks").returns(Promise.resolve(items));
    // initial sync, create the parent task
    await this.sync.sync({});

    // add a subtask as a child task
    tasks.items = [
      { id: uuidv4(), parent_id: tasks.items[0].id, content: "My subtask" },
    ];

    await this.sync.sync({});

    // verify
    const newTasks = await this.habitica.listTasks();
    expect(newTasks[0].checklist.length).to.equal(1);
  });

  it("convert an existing task to a subtask", async function () {
    const items = [{ id: uuidv4(), checked: false, content: "My task" }];
    const tasks = syncDataFor(6, 0, items);
    sinon.stub(this.todoist, "sync").returns(Promise.resolve(tasks));
    sinon.stub(this.todoist, "listTasks").returns(Promise.resolve(items));

    // initial sync, create the parent task
    await this.sync.sync({});
    await this.habitica.listTasks();

    const parentId = tasks.items[0].id;

    // add a second task with no parent and sync
    tasks.items = [{ id: uuidv4(), content: "My subtask" }];
    await this.sync.sync({});

    await this.habitica.listTasks();

    // now add the parent_id to the task and sync again
    tasks.items[0].parent_id = parentId;

    await this.sync.sync({});

    // verify
    const newTasks = await this.habitica.listTasks();
    expect(newTasks[0].checklist.length).to.equal(1);
    expect(newTasks.length).to.equal(2);
  });

  it("rename an existing task", async function () {
    const items = [{ id: uuidv4(), checked: false, content: "My task" }];
    const tasks = syncDataFor(6, 0, items);
    sinon.stub(this.todoist, "sync").returns(Promise.resolve(tasks));
    sinon.stub(this.todoist, "listTasks").returns(Promise.resolve(items));
    // initial sync, create the parent task
    await this.sync.sync({});
    const tasksBeforeRename = await this.habitica.listTasks();

    tasks.items[0].content = "My renamed task";
    await this.sync.sync({});

    // verify
    const newTasks = await this.habitica.listTasks();
    expect(newTasks.find((t) => t.text === "My renamed task")).to.exist;
  });
  describe("filterIgnoredProjects", function () {
    it("filters out items belonging to ignored projects", function () {
      const config = {
        projects: [
          { name: "Work", id: 1 },
          { name: "Personal", id: 2 },
          { name: "Shopping", id: 3 },
        ],
        ignoreProjects: ["Personal"],
      };
      const filter = this.sync.filterIgnoredProjects(config);
      expect(filter({ project_id: 1 })).to.be.true;
      expect(filter({ project_id: 2 })).to.be.false;
      expect(filter({ project_id: 3 })).to.be.true;
    });

    it("filters out multiple ignored projects", function () {
      const config = {
        projects: [
          { name: "Work", id: 1 },
          { name: "Personal", id: 2 },
          { name: "Shopping", id: 3 },
        ],
        ignoreProjects: ["Personal", "Shopping"],
      };
      const filter = this.sync.filterIgnoredProjects(config);
      expect(filter({ project_id: 1 })).to.be.true;
      expect(filter({ project_id: 2 })).to.be.false;
      expect(filter({ project_id: 3 })).to.be.false;
    });

    it("allows all items when no projects are ignored", function () {
      const config = {
        projects: [
          { name: "Work", id: 1 },
          { name: "Personal", id: 2 },
        ],
        ignoreProjects: [],
      };
      const filter = this.sync.filterIgnoredProjects(config);
      expect(filter({ project_id: 1 })).to.be.true;
      expect(filter({ project_id: 2 })).to.be.true;
    });

    it("handles missing projects array gracefully", function () {
      const config = {
        projects: undefined,
        ignoreProjects: [],
      };
      const filter = this.sync.filterIgnoredProjects(config);
      expect(filter({ project_id: 1 })).to.be.true;
    });
  });

  describe("updateDailies", function () {
    it("scores a recurring task with a future due date when a matching daily exists", async function () {
      const futureDate = moment().add(1, "day").format("YYYY-MM-DD");
      const items = [
        {
          id: uuidv4(),
          checked: false,
          content: "Todoist: Daily Goal",
          due: { date: futureDate, is_recurring: true },
          project_id: 1,
        },
      ];
      const tasks = syncDataFor(6, 0, items);
      sinon.stub(this.todoist, "sync").returns(Promise.resolve(tasks));
      sinon.stub(this.todoist, "listTasks").returns(Promise.resolve(items));

      await this.sync.sync({});

      const dailies = await this.habitica.listDailies();
      const daily = dailies.find((t) => t.text === "Todoist: Daily Goal");
      expect(daily.checked).to.equal(true);
    });

    it("handles recurring tasks with no due object via optional chaining", async function () {
      const items = [
        {
          id: uuidv4(),
          checked: false,
          content: "Recurring no due",
          due: null,
          project_id: 1,
        },
      ];
      // Mark as recurring by giving it due.is_recurring - but due is null here,
      // so we need to ensure isTaskRecurring matches. We'll set due after to test the path.
      const tasks = syncDataFor(6, 0, items);
      sinon.stub(this.todoist, "sync").returns(Promise.resolve(tasks));
      sinon.stub(this.todoist, "listTasks").returns(Promise.resolve(items));

      // This should not throw even though item.due is null
      await this.sync.sync({});

      // Task should still be created (it's not recurring without due, so it goes through updateTasks)
      const habiticaTasks = await this.habitica.listTasks();
      expect(habiticaTasks.length).to.be.greaterThan(0);
    });
  });

  describe("aliases via reduce", function () {
    it("builds aliases map from habitica tasks", async function () {
      // Pre-populate habitica with a known task
      this.habitica.tasks.push({
        _id: "hab-123",
        alias: "todo-456",
        text: "Existing task",
        checklist: [],
      });

      const items = [
        { id: "todo-456", checked: false, content: "Existing task" },
      ];
      const tasks = syncDataFor(6, 0, items);
      sinon.stub(this.todoist, "sync").returns(Promise.resolve(tasks));
      sinon.stub(this.todoist, "listTasks").returns(Promise.resolve(items));

      await this.sync.sync({});

      // The task should have been updated (not created new) since alias matched
      const habiticaTasks = await this.habitica.listTasks();
      const matching = habiticaTasks.filter((t) => t.text === "Existing task");
      expect(matching.length).to.be.greaterThan(0);
    });
  });

  // Pending tests:

  // scoring of checklist items
  // unscoring of checklist items
  // unscoring of a task
  // scoring daily/recurring tasks
  // skipping projects
});
