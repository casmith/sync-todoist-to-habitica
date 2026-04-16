"use strict";

const axios = require("axios");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = class Habitica {
  constructor(myAxios, logger = console) {
    this.logger = logger;
    this.axios = myAxios;
    this._setupRetryInterceptor();
  }

  static from(apiUser, apiKey, logger = console) {
    const headers = {
      ["x-api-user"]: apiUser,
      ["x-api-key"]: apiKey,
      ["x-client"]: `${apiUser}-sync-todoist-to-habitica`,
    };
    const baseURL = "https://habitica.com/api/v3/";
    const newAxios = axios.create({ headers, baseURL });
    return new Habitica(newAxios, logger);
  }

  _requestError(err) {
    const config = err.config || {};
    const method = (config.method || "").toUpperCase();
    const url = config.url || "unknown";
    const status = err.response
      ? `${err.response.status} ${err.response.statusText}`
      : err.message;
    return new Error(`${method} ${url} failed: ${status}`, { cause: err });
  }

  _setupRetryInterceptor() {
    this.axios.interceptors.response.use(null, async (error) => {
      if (error.response && error.response.status === 429) {
        const retryAfter = error.response.headers["retry-after"];
        const waitMs = retryAfter ? parseFloat(retryAfter) * 1000 : 60000;
        this.logger.warn(`Rate limited, retrying after ${waitMs}ms`);
        await sleep(waitMs);
        return this.axios.request(error.config);
      }
      throw error;
    });
  }

  async post(url, form) {
    try {
      const res = await this.axios.post(url, form);
      return res.data;
    } catch (err) {
      throw this._requestError(err);
    }
  }

  async get(url) {
    try {
      const response = await this.axios.get(url);
      return response.data;
    } catch (err) {
      throw this._requestError(err);
    }
  }

  async createTask(task) {
    return await this.post(`/tasks/user`, task);
  }

  async getTask(taskId) {
    return await this.get(`/tasks/${taskId}`);
  }

  async updateTask(task) {
    try {
      return await this.axios.put(`/tasks/${task.alias}`, task);
    } catch (err) {
      throw this._requestError(err);
    }
  }

  async deleteTask(taskId) {
    try {
      return await this.axios.delete(`/tasks/${taskId}`);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        this.logger.warn("Deleting task that no longer exists", taskId);
      } else {
        throw this._requestError(err);
      }
    }
  }

  async deleteAllTasks(type) {
    const tasks = await this.listTasks(type);
    await this.deleteTasks(tasks.map((task) => task._id));
  }

  async deleteTasks(taskIds) {
    for (const taskId of taskIds) {
      await this.deleteTask(taskId);
    }
  }

  async listTasks(type = "todos") {
    const response = await this.get(
      "/tasks/user" + (type ? `?type=${type}` : ""),
    );
    return response.data;
  }

  async listDailies() {
    return await this.listTasks("dailys");
  }

  async scoreTask(taskId) {
    return await this.post(`/tasks/${taskId}/score/up`);
  }

  async createChecklistItem(taskId, text) {
    this.logger.info(
      `Creating checklist item on task ${taskId} with content ${text}`,
    );
    return await this.post(`/tasks/${taskId}/checklist`, { text });
  }

  async updateChecklistItem(taskId, itemId, text) {
    try {
      return await this.axios.put(`/tasks/${taskId}/checklist/${itemId}`, {
        text,
      });
    } catch (err) {
      throw this._requestError(err);
    }
  }

  async deleteChecklistItem(taskId, itemId) {
    try {
      return await this.axios.delete(`/tasks/${taskId}/checklist/${itemId}`);
    } catch (err) {
      throw this._requestError(err);
    }
  }

  async scoreChecklistItem(taskId, itemId) {
    try {
      await this.post(`/tasks/${taskId}/checklist/${itemId}/score`);
    } catch (err) {
      throw this._requestError(err);
    }
  }
};
