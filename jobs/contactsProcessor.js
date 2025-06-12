const Contact = require('../models/Contact');
const BulkAction = require('../models/BulkAction');
const streamAndBatchProcessCSV = require('../utils/csvStreamImporter');
const logger = require('../utils/logger');
const { updateStatus } = require('../utils/jobTracker');

module.exports = async function process(job) {
  const { actionId, filePath } = job.data;

  logger.info(`[${actionId}] Starting contact import from: ${filePath}`);

  try {
    await streamAndBatchProcessCSV(
      filePath,
      (row) => {
        if (!row.email) {
          logger.warn(`[${actionId}] Row skipped due to missing email: ${JSON.stringify(row)}`);
          return null;
        }
        return {
          updateOne: {
            filter: { email: row.email },
            update: { $set: row },
            upsert: true
          }
        };
      },
      async (summary) => {
        logger.info(`[${actionId}] Import complete — Success: ${summary.success}, Failed: ${summary.failed}, Skipped: ${summary.skipped}`);
      },
      {
        batchSize: 10000,
        actionId,
        model: Contact,
        modelName: 'Contact',
        logger,
        updateJobStatus: updateStatus
      }
    );
  } catch (err) {
    logger.error(`[${actionId}] ContactProcessor crashed: ${err.message}`);
    await updateStatus(actionId, 'failed', {
      success: 0,
      failed: 1,
      skipped: 0,
      logs: [`Fatal error: ${err.message}`]
    });
  }
};