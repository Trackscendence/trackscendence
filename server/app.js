const express = require('express')
const path = require('path')
const middleware = require('./utils/middleware')

const app = express()


app.use(express.json())
app.use(middleware.requestLogger)

app.use('/api/ping', (req, res) => {
	res.json({ message: 'pong', time: new Date().toISOString() })
})

if (process.env.NODE_ENV === 'production') {
	app.use(express.static(path.join(__dirname, '../client/dist')))
	app.get('/*splat', (req, res) => {
		res.sendFile(path.join(__dirname, '../client/dist/index.html'))
	})
}

module.exports = app