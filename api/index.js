/**
 * api/index.js
 * Vercel serverless entry: exports the Express app as the default handler (Vercel mounts it as one function; app.js connects Mongo lazily per cold start).
 */
const { app } = require('../backend/src/app');

module.exports = app;
