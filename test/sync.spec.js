"use strict";

const expect = require("chai").expect;
const LoggerStub = require("./loggerStub");
const sinon = require("sinon");
const { v4: uuidv4 } = require("uuid");

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
    if (task) {
      task.checklist.push({
        id: uuidv4(),
        text: content,
        completed: false,
      });
    }
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

  async updateChecklistItem(taskId, itemId, content) {
    const task = this.getTask(taskId);
    if (task) {
      const item = task.checklist.find((i) => i.id === itemId);
      if (item) item.text = content;
    }
  }

  async scoreChecklistItem(taskId, itemId) {
    const task = this.getTask(taskId);
    if (task) {
      const item = task.checklist.find((i) => i.id === itemId);
      if (item) item.completed = !item.completed;
    }
  }

  async deleteChecklistItem(taskId, itemId) {
    const task = this.getTask(taskId);
    if (task) {
      task.checklist = task.checklist.filter((i) => i.id !== itemId);
    }
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
  it("scores a checklist item when the subtask is completed", async function () {
    const parentId = uuidv4();
    const childId = uuidv4();
    const items = [{ id: parentId, checked: false, content: "Parent task" }];
    const tasks = syncDataFor(6, 0, items);
    sinon.stub(this.todoist, "sync").returns(Promise.resolve(tasks));
    sinon.stub(this.todoist, "listTasks").returns(Promise.resolve(items));

    // sync to create the parent task
    await this.sync.sync({});

    // add a subtask
    tasks.items = [{ id: childId, parent_id: parentId, content: "Child task" }];
    await this.sync.sync({});

    // mark the subtask as checked
    tasks.items = [
      {
        id: childId,
        parent_id: parentId,
        content: "Child task",
        checked: true,
      },
    ];
    await this.sync.sync({});

    // verify the checklist item was scored
    const allTasks = await this.habitica.listTasks();
    const parent = allTasks.find((t) => t.alias === parentId);
    const checklistItem = parent.checklist.find((i) =>
      i.text.includes(`[${childId}]`),
    );
    expect(checklistItem.completed).to.equal(true);
  });

  it("does not unscore a checklist item that is already completed", async function () {
    const parentId = uuidv4();
    const childId = uuidv4();
    const items = [{ id: parentId, checked: false, content: "Parent task" }];
    const tasks = syncDataFor(6, 0, items);
    sinon.stub(this.todoist, "sync").returns(Promise.resolve(tasks));
    sinon.stub(this.todoist, "listTasks").returns(Promise.resolve(items));

    // sync to create parent
    await this.sync.sync({});

    // add and complete subtask
    tasks.items = [
      {
        id: childId,
        parent_id: parentId,
        content: "Child task",
        checked: true,
      },
    ];
    await this.sync.sync({});

    // sync again with same checked state — should remain completed, not toggle
    await this.sync.sync({});

    const allTasks = await this.habitica.listTasks();
    const parent = allTasks.find((t) => t.alias === parentId);
    const checklistItem = parent.checklist.find((i) =>
      i.text.includes(`[${childId}]`),
    );
    expect(checklistItem.completed).to.equal(true);
  });

  it("scores a daily/recurring task", async function () {
    const taskId = uuidv4();
    const tomorrow = require("moment")().add(1, "day").format("YYYY-MM-DD");
    const items = [
      {
        id: taskId,
        checked: false,
        content: "Todoist: Daily Goal",
        due: { date: tomorrow, is_recurring: true },
      },
    ];
    const tasks = syncDataFor(6, 0, items);
    sinon.stub(this.todoist, "sync").returns(Promise.resolve(tasks));
    sinon.stub(this.todoist, "listTasks").returns(Promise.resolve(items));

    await this.sync.sync({});

    const allTasks = await this.habitica.listTasks();
    const daily = allTasks.find((t) => t.text === "Todoist: Daily Goal");
    expect(daily.checked).to.equal(true);
  });

  it("skips tasks from ignored projects", async function () {
    const config = require("../config");
    config.ignoreProjects = ["Ignored Project"];
    const Sync = require("../sync");
    this.sync = new Sync(this.todoist, this.habitica, this.logger, config);

    const projectId = uuidv4();
    const items = [
      {
        id: uuidv4(),
        checked: false,
        content: "Ignored task",
        project_id: projectId,
      },
    ];
    const tasks = syncDataFor(6, 0, items);
    sinon.stub(this.todoist, "sync").returns(Promise.resolve(tasks));
    sinon.stub(this.todoist, "listTasks").returns(Promise.resolve(items));

    this.todoist.listProjects.returns(
      Promise.resolve([{ id: projectId, name: "Ignored Project" }]),
    );
    this.todoist.isTaskRecurring = function (task) {
      return task?.due?.is_recurring ?? false;
    };

    const originalTasks = await this.habitica.listTasks();
    await this.sync.sync({});
    const newTasks = await this.habitica.listTasks();
    expect(newTasks).to.have.lengthOf(originalTasks.length);
  });
});
