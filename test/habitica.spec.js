'use strict';

const expect = require('chai').expect;

describe('habitica', function () {
	beforeEach(function () {
		const Habitica = require('../habitica');
		this.habitica = new Habitica('dummyUser', 'dummyKey');
	});
	it('has a listTasks method', function () {
		this.sinon.stub(this.habitica.request, 'get').returns(Promise.resolve('{"data": []}'));
		return this.habitica.listTasks()
			.then(tasks => expect(tasks).to.be.an('array').and.to.be.empty);
	});
});