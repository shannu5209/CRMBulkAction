const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

module.exports = function requestLogger(req, res, next) {
  const accountId = req.headers['x-account-id'] || 'unknown';
  const requestId = req.headers['x-request-id'] || uuidv4();

  req.accountId = accountId;
  req.requestId = requestId;

  // attach winston-based logging function to request
  req.logger = (message, level = 'info') => {
    logger.log(level, `[${requestId}] [${accountId}] ${message}`);
  };

  req.logger(`Incoming ${req.method} ${req.originalUrl}`);
  next();
};
