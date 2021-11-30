'use strict';

const expect = require('chai').expect;
const axios = require('axios');
const MockAdapter = require("axios-mock-adapter");


describe('habitica', function () {
	beforeEach(function () {
		const Habitica = require('../habitica');
        this.axios = new MockAdapter(axios);	
        this.habitica = new Habitica(this.axios.axiosInstance);
	});
	it('has a listTasks method', function () {
        this.axios.onGet('/tasks/user?type=todos').reply(200, {"data": []});
		return this.habitica.listTasks()
			.then(tasks => expect(tasks).to.be.an('array').and.to.be.empty);
	});
});
