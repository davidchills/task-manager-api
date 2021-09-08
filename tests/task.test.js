const request = require('supertest')
const app = require('../src/app')
const Task = require('../src/models/task')
const { 
	userOneId,
	userOne,
	userTwoId,
	userTwo,
	taskOne,
	taskTwo,
	taskThree,
	setupDatabase,
	teardownDatabase 
} = require('./fixtures/db')

beforeEach(setupDatabase)

test('Should create task for user', async () => {
	const response = await request(app)
		.post('/tasks')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send({
			description: 'From my test'
		})
		.expect(201)

	const task = await Task.findById(response.body._id)
	expect(task).not.toBeNull()
	expect(task.completed).toEqual(false)
})

test('Should not be able to create a task when not logged in', async () => {
	await request(app)
		.post('/tasks')
		.send({ description: 'Ticket Description' })
		.expect(401)
})

test('Select all tasks for user one', async () => {
	const response = await request(app)
		.get('/tasks')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(200)

	expect(response.body.length).toEqual(2)
})

test('Should not be able to view tasks when not logged in', async () => {
	await request(app)
		.get('/tasks')
		.send()
		.expect(401)
})

test('Owner should be able to delete a task if logged in', async () => {
	await request(app)
		.delete('/tasks/' + taskOne._id)
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(200)

	const task = await Task.findById(taskOne._id)
	expect(task).toBeNull()
})

test('Should not be able to delete a task if not logged in', async () => {
	await request(app)
		.delete('/tasks/' + taskOne._id)
		.send()
		.expect(401)
})

test('Second user should not be able to delete the first task', async () => {
	const response = await request(app)
		.delete('/tasks/' + taskOne._id)
		.set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
		.send()
		.expect(404)

	const task = await Task.findById(taskOne._id)
	expect(task).not.toBeNull()
})

test('Owner should be able to update task', async () => {
	await request(app)
		.patch('/tasks/' + taskOne._id)
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send({
			description: 'Updated Description',
			completed: true
		})
		.expect(200)

	const task = await Task.findById(taskOne._id)
	expect(task.description).toEqual('Updated Description')
	expect(task.completed).toEqual(true)
})

test('Owner should be able to fetch task by ID', async () => {
	const response = await request(app)
		.get('/tasks/' + taskThree._id)
		.set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
		.send()
		expect(200)

	expect(response.body.description).toEqual('Third Task')
})

test('User should not be able to view other users task', async () => {
	const response = await request(app)
		.get('/tasks/' + taskThree._id)
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(404)	
})

test('Owner should be able to fetch only completed tasks', async () => {
	const response = await request(app)
		.get('/tasks?completed=true')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(200)

	expect(response.body.length).toEqual(1)
})

test('Owner should be able to fetch only incomplete tasks', async () => {
	const response = await request(app)
		.get('/tasks?completed=false')
		.set('Authorization', `Bearer ${userOne.tokens[0].token}`)
		.send()
		.expect(200)

	expect(response.body.length).toEqual(1)
})


afterAll(() => {
    teardownDatabase()
})