"use strict";

const _ = require("lodash"),
  moment = require("moment"),
  jsonFile = require("jsonfile");

module.exports = class Sync {
  constructor(todoist, habitica, logger, config) {
    this.priorityMap = {
      1: 0.1,
      2: 1,
      3: 1.5,
      4: 2,
    };
    this.habitica = habitica;
    this.logger = logger;
    this.todoist = todoist;
    this.config = config;
  }

  async sync(lastRun) {
    this.logger.info("*** SYNC STARTED ***");
    this.config.append = function (key, obj) {
      this[key] = obj;
      return this;
    };
    const config = this.config;
    lastRun = lastRun || {};
    config.lastRun = lastRun;
    return this.getHabiticaTasks(config)
      .then(() => this.getProjects(config))
      .then((config) => this.getSyncData(config, lastRun.syncToken))
      .then((config) => this.scoreCompletedTasks(config))
      .then((config) => this.updateDailies(config))
      .then((config) => this.updateTasks(config))
      .then((config) => this.checkDailyGoal(config))
      .then((config) => this.syncChecklistItems(config));
  }

  getHabiticaTasks(config) {
    this.logger.info("Getting habitica tasks");
    return this.habitica
      .listTasks()
      .then((tasks) => {
        this.logger.info("Loaded tasks");
        config.habiticaTasks = tasks;
        config.aliases = _.reduce(
          tasks,
          (acc, task) => {
            acc[task.alias] = task._id;
            return acc;
          },
          {},
        );
      })
      .then(() => {
        return this.habitica.listDailies().then((dailies) => {
          this.logger.info("Loaded dailies");
          config.habiticaDailies = dailies;
        });
      })
      .then(() => {
        return this.habitica.listTasks("habits").then((habits) => {
          this.logger.info("Loaded habits");
          config.habiticaHabits = habits;
        });
      })
      .then(() => {
        this.logger.info("Finished loading habitica tasks");
        return config;
      });
  }

  getProjects(config) {
    return this.todoist
      .listProjects()
      .then((projects) => config.append("projects", projects));
  }

  getSyncData(config, syncToken) {
    config.todoistLookup = {};
    return this.todoist
      .sync(syncToken)
      .then((sync) => {
        config.sync = sync;
        config.sync.checklistItems = sync.items.filter(
          (item) => item.parent_id,
        );

        // TODO: normalize the data structure so it confirms with the task list below
        config.sync.items.forEach((i) => (config.todoistLookup[i.id] = i));

        return config;
      })
      .then((config) => {
        this.logger.info("Fetching all todoist tasks");
        return this.todoist.listTasks(syncToken).then((tasks) => {
          tasks.forEach((i) => (config.todoistLookup[i.id] = i));
          config.todoistTasks = tasks;
          return config;
        });
      });
  }

  async scoreCompletedTasks(config) {
    const sync = config.sync;
    const items = sync.items
      .filter((item) => !item.parent_id)
      .filter((item) => item.checked);

    for (const item of items) {
      this.logger.info("Scoring task", item.id, item.content);
      try {
        await this.habitica.scoreTask(item.id);
      } catch (e) {
        console.warn("Failed to score a task: " + item.content);
      }
    }
    return config.append(
      "items",
      sync.items.filter((item) => !item.checked),
    );
  }

  updateDailies(config) {
    const isProjectAllowed = this.filterIgnoredProjects(config);
    return Promise.all(
      config.items
        .filter(isProjectAllowed)
        .filter(this.todoist.isTaskRecurring)
        .map((item) => {
          // if the recurring task's due date is in the future, this means it was probably completed
          // unless it was simply created with a future due date
          const dueDate = _.get(item, "due.date");
          if (dueDate && moment(dueDate).isAfter(moment())) {
            // try to find a matching "daily" in habitica and score it
            const task = config.habiticaDailies.find(
              (i) =>
                i.text.toLowerCase().trim() ===
                item.content.toLowerCase().trim(),
            );
            if (task) {
              this.logger.info("Scoring daily task", task.text);
              return this.habitica
                .scoreTask(task._id)
                .catch((e) =>
                  console.warn("Failed to score a task: " + item.content),
                );
            } else if (config.todoist.unmatchedDailyTask) {
              return this.scoreTaskByName(
                config,
                config.todoist.unmatchedDailyTask,
              ).catch((e) => {
                this.logger.error("Failed to score unmatched daily task:" + e);
              });
            } else {
              this.logger.warn(
                `Recurring task completed but no daily could be found in habitica called [${item.content}]`,
              );
            }
          } else {
            this.logger.info(`Skipping newly-created daily [${item.content}]`);
          }
        }),
    ).then(() => config);
  }

  async updateTasks(config) {
    const isProjectAllowed = this.filterIgnoredProjects(config);

    let items = config.items
      .filter(isProjectAllowed)
      .filter((t) => !t.parent_id)
      .filter((t) => !this.todoist.isTaskRecurring(t));

    for (const item of items) {
      const aliases = config.habiticaTasks.map((t) => t.alias);
      if (item.is_deleted) {
        let checklistItem = null;
        let habiticaTask = null;
        this.config.habiticaTasks.forEach((t) => {
          const checklistPrefix = `[${item.id}]`;
          const found =
            t.checklist &&
            t.checklist.find((li) => li.text.includes(checklistPrefix));
          if (found) {
            checklistItem = found;
            habiticaTask = t;
            return false;
          }
        });
        if (checklistItem) {
          await this.habitica.deleteChecklistItem(
            habiticaTask.id,
            checklistItem.id,
          );
        } else {
          await this.deleteTask(item);
        }
      } else if (_.includes(aliases, item.id + "")) {
        await this.updateTask(item, config.aliases[item.id]);
      } else {
        if (!item.parent_id) {
          // don't create new tasks in habitica which are subtasks in todoist = those should be checklist items!
          try {
            const newItem = await this.createTask(item);
            this.config.habiticaTasks.push(newItem);
          } catch (e) {
            this.logger.warn("failed to create task: " + item.content);
          }
        } else {
          this.logger.info("skipping child task", item.content);
        }
      }
    }
    return config;
  }

  checkDailyGoal(config) {
    return this.todoist
      .getStats()
      .then((stats) => {
        const lastRun = config.lastRun;
        const goal = stats.goals.daily_goal;
        const today = moment(stats["days_items"][0].date);
        const lastDailyGoal = lastRun.lastDailyGoal;
        const completed = stats["days_items"][0].total_completed;
        this.logger.info(
          "Daily goal: [" + goal + "] Completed: [" + completed + "]",
        );
        if (
          completed >= goal &&
          (!lastDailyGoal || today.isAfter(lastRun.lastDailyGoal, "d"))
        ) {
          return this.scoreDailyGoalTask(config, today);
        }
      })
      .then(() => config);
  }

  createHabiticaTask(todoistTask) {
    const todoistDate = todoistTask.due_date_utc;
    const dueDate = todoistDate && moment(todoistDate).format();
    return {
      type: "todo",
      text: todoistTask.content,
      alias: todoistTask.id,
      priority: this.priorityMap[todoistTask.priority],
      date: dueDate,
    };
  }

  createTask(todoistTask) {
    this.logger.info("Creating new habitica task: " + todoistTask.content);
    return this.habitica.createTask(this.createHabiticaTask(todoistTask));
  }

  deleteTask(task) {
    this.logger.info("Deleting habitica task: " + task.content);
    return this.habitica
      .deleteTask(task.id)
      .catch((e) =>
        console.warn(`Task ${task.id} wasn't deleted because it doesn't exist`),
      );
  }

  filterIgnoredProjects(config) {
    const ignoreProjectIds = config.ignoreProjects.map((projectName) => {
      return _.keyBy(config.projects, "name")[projectName].id;
    });
    return function (item) {
      const projectId = item.project_id;
      return !_.includes(ignoreProjectIds, projectId);
    };
  }

  findRootTask(todoistTask) {
    let task = todoistTask;
    let parentId = todoistTask.parent || todoistTask.parent_id;
    while (parentId) {
      task = this.config.todoistLookup[parentId];
      if (!task) {
        throw Error(`Task not found for parentId [${parentId}]`);
      }
      parentId = task.parent || task.parent_id;
    }
    return task;
  }

  syncChecklistItems(config) {
    const checklistItems = config.sync.checklistItems || [];

    return Promise.all(
      checklistItems.map((todoistItem) => {
        const parentTask = this.findRootTask(todoistItem);
        const taskId = parentTask.id;
        const habiticaTask = config.habiticaTasks.find(
          (i) => i && i.alias == parentTask.id,
        );
        if (!habiticaTask) {
          this.logger.warn(
            "Could not find a habitica task for todoist item",
            parentTask.id,
          );
          return;
        }
        const checklist = habiticaTask.checklist;
        const content = this.createChecklistItem(todoistItem);
        const habiticaChecklistItem = checklist.find((item) =>
          item.text.includes(`[${todoistItem.id}]`),
        );
        if (habiticaChecklistItem) {
          const itemId = habiticaChecklistItem.id;
          if (todoistItem.is_deleted) {
            return this.habitica.deleteChecklistItem(taskId, itemId);
          } else {
            this.logger.info("Updating checklist item");
            return this.habitica
              .updateChecklistItem(taskId, itemId, content)
              .then(() => {
                if (todoistItem.checked && !habiticaChecklistItem.completed) {
                  return this.habitica.scoreChecklistItem(taskId, itemId);
                }
              });
          }
        } else {
          console.log("creating checklist item");

          const staleTask = config.habiticaTasks.find(
            (t) => t.alias == todoistItem.id,
          );

          // if the task exists, delete it
          if (staleTask) {
            // found a task that was converted to a checklist item, so we need to delete it
            this.logger.info(
              `Detected task that was converted to a subtask - deleting (${staleTask._id}).`,
            );
            return (
              todoistItem.is_deleted ||
              this.habitica
                .deleteTask(staleTask._id)
                .then(() => this.habitica.createChecklistItem(taskId, content))
            );
          } else {
            return (
              todoistItem.is_deleted ||
              this.habitica.createChecklistItem(taskId, content)
            );
          }
        }
      }),
    ).then(() => config);
  }

  scoreDailyGoalTask(config, today) {
    // TODO: make this configurable
    const taskName = "Todoist: Daily Goal";
    return this.scoreTaskByName(config, taskName)
      .then((task) => {
        this.logger.info(`Daily goal reached! Scored ${taskName}`, task._id);
        config.lastRun.lastDailyGoal = today;
      })
      .catch((e) => this.logger.info(e));
  }

  scoreTaskByName(config, taskName) {
    const task =
      config.habiticaDailies.find((t) => t.text === taskName) ||
      config.habiticaHabits.find((t) => t.text === taskName);
    if (task) {
      return this.habitica.scoreTask(task._id).then((ignored) => task);
    } else {
      return Promise.reject(`${taskName} not found`);
    }
  }

  /**
   * Generates the checklist item text for habitica from a todoist task
   *
   * The text will be in the form "[id] content", e.g., "[2342342342] walk the dog"
   */
  createChecklistItem(todoistTask) {
    return `[${todoistTask.id}] ${todoistTask.content}`;
  }

  updateTask(todoistTask) {
    this.logger.info("Updating habitica task:" + todoistTask.content);
    if (!!todoistTask.parent) {
      // delete tasks in habitica which have become child tasks in todoist
      return this.deleteTask(todoistTask);
    } else {
      return this.habitica.updateTask(this.createHabiticaTask(todoistTask));
    }
  }
};
