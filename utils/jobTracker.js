const BulkAction = require('../models/BulkAction');
const logger = require('./logger');

exports.updateStatus = async (actionId, status, summary = {}) => {
  try {
    const update = {
      status,
      stats: {
        success: summary.success || 0,
        failed: summary.failed || 0,
        skipped: summary.skipped || 0
      },
      logs: summary.logs || []
    };

    await BulkAction.updateOne({ actionId }, { $set: update });
    logger.info(`[${actionId}] Job status updated to '${status}'`);
  } catch (err) {
    logger.error(`[${actionId}] Failed to update job status: ${err.message}`);
  }
};