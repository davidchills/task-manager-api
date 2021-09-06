const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
	sgMail.send({
		to: email,
		from: 'daveh@dailyhills.com',
		subject: 'Thanks for joining in!',
		text: `Welcome to the Task App, ${name}. Let me know you get along with the app.`
	})
}

const sendCancelationEmail = (email, name) => {
	sgMail.send({
		to: email,
		from: 'daveh@dailyhills.com',
		subject: 'Sorry to see you go!',
		text: `${name}, you are welcome back to the Task App any time.`
	})	
}

module.exports = {
	sendWelcomeEmail,
	sendCancelationEmail
}