const express = require('express')
// Below is need so that we can check if a passed in value for id is a valid ID in the findById() methods
const ObjectId = require('mongoose').Types.ObjectId;
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

// Create a task
router.post('/tasks', auth, async (req, res) => {
	const task = new Task({
		...req.body, 
		owner: req.user._id
	})

	try {
		await task.save()
		res.status(201).send(task)
	} 
	catch (error) { res.status(400).send(error) }
})

// Get all tasks with optional filtering and pagination
// /tasks?completed=true
// /tasks?limit=10&skip=0
// /tasks?sortBy=createdAt_asc
router.get('/tasks', auth, async (req, res) => {
	// const match = {}
	// const sort = {}
	
	// The very basics of the needed options for populate
	const populateOptions = { path: 'tasks' }

	// Only add match criteria if suuplied
	if (req.query.completed) {
		populateOptions.match = {}
		populateOptions.match.completed = (req.query.completed === 'true')
	}

	// Only add the sort data if it is supplied
	if (req.query.sortBy) {
		const parts = req.query.sortBy.split('_')
		populateOptions.sort = {}
		populateOptions.sort[parts[0]] = (parts[1] === 'desc') ? -1 : 1
	}

	// Only add the limit if a value is supplied
	if (req.query.limit) { populateOptions.limit = parseInt(req.query.limit, 10) }

	// Only add the skip if a value is provided
	if (req.query.skip) { populateOptions.skip = parseInt(req.query.skip, 10) }
	// console.log(populateOptions)

	try {
		// A different way to get tasks for the authenticated user
		// const tasks = await Task.find({ owner: req.user._id })
		// res.send(tasks)
		
		// await req.user.populate([{
		// 	path: 'tasks',
		// 	match: match,
		// 	options: {
		// 		limit: parseInt(req.query.limit, 10),
		// 		skip: parseInt(req.query.skip, 10),
		// 		sort: sort
		// 	}
		// }])
		await req.user.populate([populateOptions])
		res.send(req.user.tasks)
	} 
	catch (error) { res.status(500).send(error) }
})

// Get task by id
router.get('/tasks/:id', auth, async (req, res) => {
	const _id = req.params.id
	// Check and make sure the id can be a valid ID
	if (!ObjectId.isValid(_id)) { return res.status(400).send({ error: 'Task ID is not valid' }) }

	try {
		const task = await Task.findOne({ _id, owner: req.user._id })
		if (!task) { res.status(404).send({ error: 'Task not found' }) }
		res.send(task)
	} 
	catch (error) { res.status.toString(500).send(error) }
})

router.patch('/tasks/:id', auth, async (req, res) => {
	const _id = req.params.id
	// Check and make sure the id can be a valid ID
	if (!ObjectId.isValid(_id)) { return res.status(404).send({ error: 'Task ID is not valid' }) }
	const updates = Object.keys(req.body)
	const allowedUpdates = ['description', 'completed']
	const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

	if (!isValidOperation) { return res.status(400).send({ error: 'Invalid Updates!' }) }

	try {
		const task = await Task.findOne({ _id, owner: req.user._id })

		if (!task) { return res.status(404).send({ error: 'Task not found' }) }

		updates.forEach((update) => { task[update] = req.body[update] })
		await task.save()
		res.send(task)
	} 
	catch (error) { res.status(500).send(error) }	
})

router.delete('/tasks/:id', auth, async (req, res) => {
	const _id = req.params.id
	// Check and make sure the id can be a valid ID
	if (!ObjectId.isValid(_id)) { return res.status(404).send({ error: 'Task ID is not valid' }) }

	try {
		const task = await Task.findOneAndDelete({ _id, owner: req.user._id })
		if (!task) { return res.status(404).send({ error: 'Task not found' }) }
		res.send(task)
	} 
	catch (error) { res.status(500).send(error) }
})

module.exports = router