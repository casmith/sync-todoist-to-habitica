"use strict";

const axios = require("axios");

module.exports = class Habitica {
  constructor(myAxios, logger = console) {
    this.logger = logger;
    this.axios = myAxios;
  }

  static from(apiUser, apiKey, logger = console) {
    const headers = {
      ["x-api-user"]: apiUser,
      ["x-api-key"]: apiKey,
    };
    const baseURL = "https://habitica.com/api/v3/";
    const newAxios = axios.create({ headers, baseURL });
    return new Habitica(newAxios, logger);
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async post(url, form) {
    await this.sleep(2000);
    const res = await this.axios.post(url, form);
    return res.data;
  }

  async get(url) {
    await this.sleep(2000);
    const response = await this.axios.get(url);
    return response.data;
  }

  async createTask(task) {
    return await this.post(`/tasks/user`, task);
  }

  async getTask(taskId) {
    return await this.get(`/tasks/${taskId}`);
  }

  async updateTask(task) {
    return await this.axios.put(`/tasks/${task.alias}`, task);
  }

  async deleteTask(taskId) {
    try {
      await this.sleep(2000);
      return await this.axios.delete(`/tasks/${taskId}`);
    } catch (err) {
      if (err.response.status === 404) {
        this.logger.warn("Deleting task that no longer exists", taskId);
      } else {
        throw err;
      }
    }
  }

  async deleteAllTasks(type) {
    const tasks = await this.listTasks(type);
    await deleteTasks(tasks.map((task) => task._id));
  }

  async deleteTasks(taskIds) {
    for (const taskId of taskIds) {
      await this.deleteTask(taskId);
    }
  }

  async listTasks(type = "todos") {
    const response = await this.get(
      "/tasks/user" + (type ? `?type=${type}` : "")
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
    return await this.post(`/tasks/${taskId}/checklist`, text);
  }

  async updateChecklistItem(taskId, itemId, text) {
    await this.sleep(2000);
    return await this.axios.put(`/tasks/${taskId}/checklist/${itemId}`, {
      text,
    });
  }

  async deleteChecklistItem(taskId, itemId) {
    await this.sleep(2000);
    return await this.axios.delete(`/tasks/${taskId}/checklist/${itemId}`);
  }

  async scoreChecklistItem(taskId, itemId) {
    try {
      await this.post(`/tasks/${taskId}/checklist/${itemId}/score`);
    } catch (e) {
      throw new Error("failed to score up a task");
    }
  }
};
