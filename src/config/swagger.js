const swaggerJSDoc = require('swagger-jsdoc');
const { version } = require('../../package.json');
const environment = require('./environment');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'ReMarket API Documentation',
    version,
    description:
      'This is a REST API application made with Express. It retrieves data from a MongoDB database.',
    license: {
      name: 'Licensed Under MIT',
      url: 'https://spdx.org/licenses/MIT.html',
    },
    contact: {
      name: 'Your Name',
      url: 'https://your-website.com',
    },
  },
  servers: [
    {
      url: `http://localhost:${environment.port}/api/v1`,
      description: 'Development server',
    },
  ],
};

const options = {
  swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: ['src/routes/v1/*.js', 'src/models/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
