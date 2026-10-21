/**
 * app.js
 * Express application wiring: security middleware, request logging, routes, error handlers. Exports app.
 */
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const { config } = require('./config');
const { requestLogger } = require('./middleware/requestLogger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { healthRouter } = require('./routes/health.routes');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: config.cors.origin === '*' ? true : config.cors.origin.split(',') }));
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

app.use('/', healthRouter);

app.use(notFound);
app.use(errorHandler);

module.exports = { app };
