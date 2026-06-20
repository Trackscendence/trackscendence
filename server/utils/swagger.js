const swaggerJsdoc = require('swagger-jsdoc')

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Trackscendence API',
      version: '1.0.0',
      description: 'API documentation',
    },
    servers: [
      {
        url: '/api/v1',
      },
    ],
  },
  apis: ['./src/modules/**/*.routes.js'],
}

module.exports = swaggerJsdoc(options)
