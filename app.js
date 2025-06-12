const express = require('express');
const mongoose = require('mongoose');
const requestLogger = require('./middleware/logger');
const rateLimiter = require('./middleware/rateLimiter');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(requestLogger);
app.use(rateLimiter);

mongoose.connect(process.env.MONGO_URI);
app.use('/bulk-actions', require('./routes/bulkRoutes'));

module.exports = app;
