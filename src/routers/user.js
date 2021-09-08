const express = require('express')
// Below is need so that we can check if a passed in value for id is a valid ID in the findById() methods
const ObjectId = require('mongoose').Types.ObjectId;
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account')
const router = new express.Router()

// Create a user
router.post('/users', async (req, res) => {
	const user = new User(req.body)

	try {
		await user.save()
		if (user.age !== 999) { sendWelcomeEmail(user.email, user.name) }
		const token = await user.generateAuthToken()
		res.status(201).send({ user, token })
	} 
	catch (error) { res.status(400).send(error) }
})

// Login a user
router.post('/users/login', async (req,res) => {
	try {
		const user = await User.findByCredentials(req.body.email, req.body.password)
		const token = await user.generateAuthToken()
		res.send({ user, token })
	} 
	catch (error) { res.status(400).send(error) }
})

// Logout a user
router.post('/users/logout', auth, async (req, res) => {
	try {
		req.user.tokens = req.user.tokens.filter((token) => {
			return token.token !== req.token
		})
		await req.user.save()
		res.send()
	} 
	catch (error) { res.status(500).send(error) }
})

// Logout a user from every where
router.post('/users/logoutAll', auth, async (req, res) => {
	try {
		req.user.tokens = []
		await req.user.save()
		res.send()
	} 
	catch (error) { res.status(500).send(error) }
})

// Get all users
router.get('/users/me', auth, async (req, res) => {
	res.send(req.user)
})

// Update a user
router.patch('/users/me', auth, async (req, res) => {
	const updates = Object.keys(req.body)
	const allowedUpdates = ['name', 'email', 'password', 'age']
	const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

	if (!isValidOperation) { return res.status(400).send({ error: 'Invalid Updates!' }) }

	try {
		updates.forEach((update) => { req.user[update] = req.body[update] })
		await req.user.save()
		res.send(req.user)
	} 
	catch (error) { res.send(500).send(error) }
})

// Delete a user by id
router.delete('/users/me', auth, async (req, res) => {
	try {
		await req.user.remove()
		if (req.user.age !== 999) { sendCancelationEmail(req.user.email, req.user.name) }
		res.send(req.user)
	} 
	catch (error) { res.status(500).send(error) }
})

// Upload a user avatar
const upload = multer({
	limits: {
		fileSize: 1_000_000
	},
	fileFilter(req, file, cb) {
		if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
			return cb(new Error('Only image files (jpg, jpeg, png) are allowed'))
		}
		cb(undefined, true)
		// cb(new Error('File must be a PDF'))
		// cb(undefined, true)
		// cb(undefined, false)
	}
})
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
	const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
	req.user.avatar = buffer
	await req.user.save()
	res.send()
}, (error, req, res, next) => {
	res.status(400).send({ error: error.message })
})

// Remove user avatar data
router.delete('/users/me/avatar', auth, async (req, res) => {
	req.user.avatar = undefined
	await req.user.save()
	res.send()
})

// Get a link for a users avatar
router.get('/users/:id/avatar', async (req, res) => {
	const _id = req.params.id
	// Check and make sure the id can be a valid ID
	if (!ObjectId.isValid(_id)) { return res.status(404).send({ error: 'User ID is not valid' }) }	
	try {
		const user = await User.findById(_id)
		if (!user || !user.avatar) { throw new Error() }
		res.set('Content-Type', 'image/png')
		res.send(user.avatar)
	}
	catch (error) { res.status(404).send() }
})

module.exports = router