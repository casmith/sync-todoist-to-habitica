"use strict";

const expect = require("chai").expect;
const axios = require("axios");
const MockAdapter = require("axios-mock-adapter");
const sinon = require("sinon");

describe("habitica", function () {
  beforeEach(function () {
    const Habitica = require("../habitica");
    this.axios = new MockAdapter(axios);
    this.habitica = new Habitica(this.axios.axiosInstance, console);
  });
  it("has a listTasks method", function () {
    this.axios.onGet("/tasks/user?type=todos").reply(200, { data: [] });
    return this.habitica
      .listTasks()
      .then((tasks) => expect(tasks).to.be.an("array").and.to.be.empty);
  });

  it("lists dailies", function () {
    this.axios.onGet("/tasks/user?type=dailys").reply(200, { data: [] });
    return this.habitica.listDailies();
  });

  it("creates a task", function () {
    this.axios.onPost("/tasks/user").reply(200);
    return this.habitica.createTask("blah blah");
  });

  it("gets a task", function () {
    this.axios.onGet("/tasks/123").reply(200);
    return this.habitica.getTask("123");
  });

  it("updates a task", function () {
    this.axios.onPut("/tasks/123").reply(200);
    return this.habitica.updateTask({ alias: "123", text: "blah" });
  });

  it("deletes a task", function () {
    this.axios.onDelete("/tasks/123").reply(200);
    return this.habitica.deleteTask("123");
  });

  it("deletes a task that no longer exists", function () {
    this.axios.onDelete("/tasks/123").reply(404);
    return this.habitica.deleteTask("123");
  });

  it("deletes multiple tasks", function () {
    this.axios.onDelete(/\/tasks\/\d+/).reply(200);
    return this.habitica.deleteTasks([1, 2, 3]);
  });

  it("scores a task", function () {
    this.axios.onPost(`/tasks/123/score/up`).reply(200);
    return this.habitica.scoreTask("123");
  });

  it("creates a checklist item", function () {
    this.axios.onPost("/tasks/123/checklist").reply(200);
    return this.habitica.createChecklistItem("123", "blah blah blah");
  });

  it("updates a checklist item", function () {
    this.axios.onPut("/tasks/123/checklist/1").reply(200);
    return this.habitica.updateChecklistItem("123", "1", "things and stuff");
  });

  it("deletes a checklist item", function () {
    this.axios.onDelete("/tasks/123/checklist/1").reply(200);
    return this.habitica.deleteChecklistItem("123", "1");
  });

  it("scores a checklist item", function () {
    this.axios.onPost("/tasks/123/checklist/1/score").reply(200);
    return this.habitica.scoreChecklistItem("123", "1");
  });

  it("fails to score a checklist item", function () {});

  describe("rate limit handling", function () {
    beforeEach(function () {
      const Habitica = require("../habitica");
      const instance = axios.create();
      this.mock = new MockAdapter(instance);
      this.logger = {
        info: sinon.stub(),
        warn: sinon.stub(),
        error: sinon.stub(),
      };
      this.habitica = new Habitica(instance, this.logger);
    });

    it("retries after 429 with retry-after header", async function () {
      this.mock
        .onGet("/tasks/123")
        .replyOnce(429, {}, { "retry-after": "0.01" })
        .onGet("/tasks/123")
        .replyOnce(200, { success: true });

      const result = await this.habitica.getTask("123");
      expect(result).to.deep.equal({ success: true });
      expect(this.logger.warn.calledOnce).to.be.true;
      expect(this.logger.warn.firstCall.args[0]).to.include("Rate limited");
    });

    it("retries POST requests after 429", async function () {
      this.mock
        .onPost("/tasks/user")
        .replyOnce(429, {}, { "retry-after": "0.01" })
        .onPost("/tasks/user")
        .replyOnce(200, { created: true });

      const result = await this.habitica.createTask({ text: "test" });
      expect(result).to.deep.equal({ created: true });
    });

    it("throws non-429 errors", async function () {
      this.mock.onGet("/tasks/123").reply(500);

      try {
        await this.habitica.getTask("123");
        expect.fail("should have thrown");
      } catch (err) {
        expect(err.message).to.include("GET /tasks/123 failed");
        expect(err.message).to.include("500");
      }
    });
  });
});
