const rateLimit = {};
const WINDOW_SIZE = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10000;

module.exports = function rateLimiter(req, res, next) {
  const accountId = req.headers['x-account-id'] || 'unkown';
  if (!accountId) return res.status(400).send('Missing account ID');

  const currentTime = Date.now();
  if (!rateLimit[accountId]) {
    rateLimit[accountId] = [];
  }

  rateLimit[accountId] = rateLimit[accountId].filter(ts => currentTime - ts < WINDOW_SIZE);
  if (rateLimit[accountId].length >= MAX_REQUESTS) {
    return res.status(429).send('Rate limit exceeded');
  }

  rateLimit[accountId].push(currentTime);
  next();
};
