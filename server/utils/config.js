require('dotenv').config()

const PORT = process.env.PORT

const NODE_ENV = process.env.NODE_ENV

const DATABASE_URL = process.env.DATABASE_URL

module.exports = {
	PORT,
	NODE_ENV,
	DATABASE_URL,
}
