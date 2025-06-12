// utils/csvStreamImporter.js

const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const logger = require('../middleware/logger')

/**
 * Streams and processes a CSV file in batches.
 *
 * @param {String} filePath - Absolute or relative path to CSV file
 * @param {Function} transformToBulkOps - (row) => MongoDB bulkWrite ops [{ updateOne, insertOne, etc. }]
 * @param {Function} onComplete - (summary) => callback after all done
 * @param {Object} options - Optional config: { batchSize, logger, actionId, modelName, updateJobStatus }
 */
async function streamAndBatchProcessCSV(filePath, transformToBulkOps, onComplete, options = {}) {
  console.log('comming here')
  const {
    batchSize = 10000,
    logger = console,
    actionId = 'unknown',
    model,
    modelName = 'unknownModel',
    updateJobStatus = async () => {}
  } = options;

  const buffer = [];
  let success = 0, failed = 0, skipped = 0;
  const logs = [];
  await updateJobStatus(actionId, 'inprogress', {
    success,
    failed,
    skipped,
    logs
  });
  try {
    const stream = fs.createReadStream(path.resolve(filePath))
      .pipe(csv.parse({ headers: true }));
      logger.info(`stream completed , now processing it`)
    for await (const row of stream) {
      const op = transformToBulkOps(row);
      if (!op) {
        skipped++;
        logs.push(`Skipped invalid row: ${JSON.stringify(row)}`);
        continue;
      }

      buffer.push(op);

      if (buffer.length >= batchSize) {
        try {
          const result = await model.bulkWrite(buffer, { ordered: false });
          const upserted = result.result?.nUpserted || 0;
          const modified = result.result?.nModified || 0;
          success += upserted + modified;
          await updateJobStatus(actionId, 'inprogress', {
            success,
            failed,
            skipped,
            logs
          });
          logs.push(`Batch processed (${modelName}): ${upserted} upserted, ${modified} modified`);
        } catch (err) {
          failed += buffer.length;
          await updateJobStatus(actionId, 'inprogress', {
            success,
            failed,
            skipped,
            logs
          });
          logs.push(`Batch failed (${modelName}): ${err.message}`);
          logger.error(`[${actionId}] Batch error: ${err.message}`);
        }
        buffer.length = 0;
      }
    }

    if (buffer.length > 0) {
      try {
        const result = await model.bulkWrite(buffer, { ordered: false });
        const upserted = result.result?.nUpserted || 0;
        const modified = result.result?.nModified || 0;
        success += upserted + modified;
        await updateJobStatus(actionId, 'inprogress', {
          success,
          failed,
          skipped,
          logs
        });
        logs.push(`Final batch processed (${modelName}): ${upserted} upserted, ${modified} modified`);
      } catch (err) {
        failed += buffer.length;
        await updateJobStatus(actionId, 'inprogress', {
          success,
          failed,
          skipped,
          logs
        });
        logs.push(`Final batch failed (${modelName}): ${err.message}`);
        logger.error(`[${actionId}] Final batch error: ${err.message}`);
      }
    }

    
  const summary = { success, failed, skipped, logs };
    await onComplete(summary);
    await updateJobStatus(actionId, 'completed', summary);
  } catch (err) {
    logger.error(`[${actionId}] Fatal error in stream processing: ${err.message}`);
    const summary = { success, failed: failed + buffer.length, skipped, logs: [...logs, `Fatal error: ${err.message}`] };
    await onComplete(summary);
    await updateJobStatus(actionId, 'failed', summary);
  }
}

module.exports = streamAndBatchProcessCSV;
