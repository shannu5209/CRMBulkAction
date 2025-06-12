const Contact = require('../models/Contact');
const BulkAction = require('../models/BulkAction');
const streamAndBatchProcessCSV = require('../utils/csvStreamImporter');
const logger = require('../utils/logger'); // your global Winston logger

module.exports = async function process(job) {
  try {


    const { actionId, filePath } = job.data;

    logger.info(`[${actionId}] Starting contact import from CSV: ${filePath}`);

    await streamAndBatchProcessCSV(
      filePath,

      // 🧠 Transform each row to MongoDB bulk op
      (row) => {
        if (!row.email) return null; // skip invalid
        return {
          updateOne: {
            filter: { email: row.email },
            update: { $set: row },
            upsert: true
          }
        };
      },

      // 🎯 Callback after all rows are processed
      async (summary) => {
        logger.info(`[${actionId}] Contact import completed — Success: ${summary.success}, Failed: ${summary.failed}, Skipped: ${summary.skipped}`);
      },

      {
        batchSize: 10000,
        actionId,
        model: Contact,
        modelName: 'Contact',
        logger,

        // ✅ Job status update (Mongo)
        updateJobStatus: async (id, status, summary) => {
          await BulkAction.updateOne({ actionId: id }, {
            $set: {
              status,
              stats: {
                success: summary.success,
                failed: summary.failed,
                skipped: summary.skipped
              },
              logs: summary.logs
            }
          });
          logger.info(`[${id}] Job status updated to '${status}'`);
        }
      }
    );
  } catch (err) {
    logger.info(`error occured at ContactsProcessor : ${err.message}`)
  }
};
