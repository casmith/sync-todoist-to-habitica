"use strict";

const _ = require("lodash");
const baseUrl = "https://api.todoist.com/api/v1";
const axios = require("axios");

const REPEAT_WEEKDAYS = {
  su: false,
  m: true,
  t: true,
  w: true,
  th: true,
  f: true,
  s: false,
};

module.exports = class Todoist {
  constructor(myAxios, logger) {
    this.axios = myAxios;
    this.logger = logger;
  }

  _requestError(err) {
    const method = (err.config.method || "").toUpperCase();
    const url = err.config.url || "unknown";
    const status = err.response
      ? `${err.response.status} ${err.response.statusText}`
      : err.message;
    const error = new Error(`${method} ${url} failed: ${status}`);
    if (err.response) {
      error.statusCode = err.response.status;
    }
    return error;
  }

  static from(apiToken, logger = console) {
    const headers = {
      Authorization: "Bearer " + apiToken,
    };
    const baseURL = "https://api.todoist.com";
    return new Todoist(axios.create({ baseURL: baseUrl, headers }), logger);
  }

  createTask(item) {
    return this.axios.post("/tasks", item).catch((err) => {
      throw this._requestError(err);
    });
  }

  deleteTask(id) {
    return this.axios.delete(`${baseUrl}/tasks/${id}`).catch((err) => {
      throw this._requestError(err);
    });
  }

  deleteAllTasks() {
    return this.listTasks().then((items) =>
      Promise.all(items.map((i) => this.deleteTask(i.id))),
    );
  }

  getTask(taskId) {
    return this.axios
      .get(`${baseUrl}/tasks/${taskId}`)
      .then((r) => r.data)
      .catch((err) => {
        throw this._requestError(err);
      });
  }

  isTaskRecurring(task) {
    return _.get(task, "due.is_recurring", false);
  }

  listProjects() {
    return this.axios
      .get(`${baseUrl}/projects`)
      .then((r) => r.data)
      .catch((err) => {
        throw this._requestError(err);
      });
  }

  listTasks() {
    return this.axios
      .get(`${baseUrl}/tasks`)
      .then((r) => {
        this.logger.info("Done fetching all todoist tasks");

        return r.data.results;
      })
      .catch((err) => {
        throw this._requestError(err);
      });
  }

  sync(token) {
    const url = "https://api.todoist.com/api/v1/sync";
    this.logger.info("Sync Token:", token);
    return this.axios
      .post(
        url,
        new URLSearchParams({
          resource_types: '["all"]',
          sync_token: token,
        }),
      )
      .then((r) => r.data)
      .catch((err) => {
        throw this._requestError(err);
      });
  }

  calculateFrequency(dateExpr) {
    if (dateExpr.includes("weekday")) {
      return {
        frequency: "weekly",
        repeat: REPEAT_WEEKDAYS,
      };
    }

    if (dateExpr === "every week" || dateExpr === "weekly") {
      return {
        frequency: "weekly",
      };
    }

    if (dateExpr.startsWith("every other")) {
      const dayExpr = dateExpr.substr(12).trim();
      return {
        everyX: 2,
        frequency: "weekly",
        repeat: this.getRepeat(this.getDay(dayExpr)),
      };
    }

    if (dateExpr === "every month" || dateExpr === "monthly") {
      return {
        frequency: "monthly",
      };
    }

    if (dateExpr === "every year" || dateExpr === "yearly") {
      return {
        frequency: "yearly",
      };
    }

    return {
      frequency: "daily",
    };
  }

  getDay(dayExpr) {
    switch (_.toLower(dayExpr)) {
      case "monday":
      case "mon":
      case "m":
        return "m";
      case "tuesday":
      case "tues":
      case "tue":
      case "t":
        return "t";
      case "wednesday":
      case "wed":
      case "w":
        return "w";
      case "thursday":
      case "thurs":
      case "th":
        return "th";
      case "friday":
      case "fri":
      case "f":
        return "f";
    }
  }

  getRepeat(day) {
    const repeat = {
      su: false,
      m: false,
      t: false,
      w: false,
      th: false,
      f: false,
      s: false,
    };
    repeat[day] = true;
    return repeat;
  }
};
