const { Queue } = require('bullmq');
const Redis = require('ioredis');
const redis = new Redis({ maxRetriesPerRequest: null });

const queueMap = {};

 function getQueue(entityType) {
  if (!queueMap[entityType]) {
    queueMap[entityType] = new Queue(`bulk-${entityType}`, { connection: redis });
  }
  return queueMap[entityType];
};
module.exports = getQueue