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
	} catch (error) {
		res.status(400).send(error)
	}
})

// Get all 
// /tasks?completed=true
// /tasks?limit=10&skip=0
// /tasks?sortBy=createdAt_asc
router.get('/tasks', auth, async (req, res) => {
	const match = {}
	const sort = {}
	
	if (req.query.completed) {
		match.completed = (req.query.completed === 'true')
	}

	if (req.query.sortBy) {
		const parts = req.query.sortBy.split('_')
		sort[parts[0]] = (parts[1] === 'desc') ? -1 : 1
	}

	try {
		// const tasks = await Task.find({ owner: req.user._id })
		// res.send(tasks)
		// Second way to get tasks for the authenticated user
		await req.user.populate([{
			path: 'tasks',
			match: match,
			options: {
				limit: parseInt(req.query.limit, 10),
				skip: parseInt(req.query.skip, 10),
				sort: sort
			}
		}])
		res.send(req.user.tasks)
	} catch (error) {
		res.status(400).send(error)
	}
})

// Get task by id
router.get('/tasks/:id', auth, async (req, res) => {
	const _id = req.params.id
	// Check and make sure the id can be a valid ID
	if (!ObjectId.isValid(_id)) { return res.status(400).send({ error: 'Task ID is not valid' }) }

	try {
		const task = await Task.findOne({ _id, owner: req.user._id })
		if (!task) {
			res.status(404).send({ error: 'Task not found' })
		}
		res.send(task)
	} catch (error) {
		res.status.toString(500).send(error)
	}
	//console.log(req.params)
})

router.patch('/tasks/:id', auth, async (req, res) => {
	const _id = req.params.id
	// Check and make sure the id can be a valid ID
	if (!ObjectId.isValid(_id)) { return res.status(404).send({ error: 'Task ID is not valid' }) }
	const updates = Object.keys(req.body)
	const allowedUpdates = ['description', 'completed']
	const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

	if (!isValidOperation) {
		return res.status(400).send({ error: 'Invalid Updates!' })
	}

	try {
		const task = await Task.findOne({ _id, owner: req.user._id })

		if (!task) {
			return res.status(404).send({ error: 'Task not found' })
		}

		updates.forEach((update) => {
			task[update] = req.body[update]
		})
		await task.save()
		res.send(task)
	} catch (error) {
		res.status(500).send(error)
	}	
})

router.delete('/tasks/:id', auth, async (req, res) => {
	const _id = req.params.id
	// Check and make sure the id can be a valid ID
	if (!ObjectId.isValid(_id)) { return res.status(404).send({ error: 'Task ID is not valid' }) }

	try {
		const task = await Task.findOneAndDelete({ _id, owner: req.user._id })

		if (!task) {
			return res.status(404).send({ error: 'Task not found' })
		}
		res.send(task)

	} catch (error) {
		res.status(500).send(error)
	}
})

module.exports = router