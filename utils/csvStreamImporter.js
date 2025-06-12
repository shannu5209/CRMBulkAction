const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');

async function streamAndBatchProcessCSV(filePath, transformToBulkOps, onComplete, options = {}) {
  const {
    batchSize = 10000,
    logger = console,
    actionId = 'unknown',
    model,
    modelName = 'unknownModel',
    updateJobStatus = async () => { }
  } = options;

  const buffer = [];
  let success = 0, failed = 0, skipped = 0;
  const logs = [];

  try {
    logger.info(`[${actionId}] Starting CSV stream processing for ${modelName}`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    if (!model) {
      throw new Error('Missing model to write to');
    }

    const stream = fs.createReadStream(path.resolve(filePath))
      .pipe(csv.parse({ headers: true }))
      .on('error', (err) => {
        logger.error(`[${actionId}] Stream error: ${err.message}`);
      });

    for await (const row of stream) {
      try {
        const op = transformToBulkOps(row);
        if (!op) {
          skipped++;
          const log = `Skipped invalid row: ${JSON.stringify(row)}`;
          logs.push(log);
          logger.warn(`[${actionId}] ${log}`);
          continue;
        }
        buffer.push(op);
      } catch (e) {
        skipped++;
        const log = `Transform error: ${e.message}`;
        logs.push(log);
        logger.warn(`[${actionId}] ${log}`);
      }

      if (buffer.length >= batchSize) {
        try {
          const result = await model.bulkWrite(buffer, { ordered: false });
          const upserted = result.result?.nUpserted || 0;
          const modified = result.result?.nModified || 0;
          success += upserted + modified;
          const log = `Batch processed (${modelName}): ${upserted} upserted, ${modified} modified`;
          logs.push(log);
          logger.info(`[${actionId}] ${log}`);
        } catch (err) {
          failed += buffer.length;
          const log = `Batch failed (${modelName}): ${err.message}`;
          logs.push(log);
          logger.error(`[${actionId}] ${log}`);
        }

        buffer.length = 0;
        await updateJobStatus(actionId, 'inprogress', { success, failed, skipped, logs });
      }
    }

    if (buffer.length > 0) {
      try {
        const result = await model.bulkWrite(buffer, { ordered: false });
        const upserted = result.result?.nUpserted || 0;
        const modified = result.result?.nModified || 0;
        success += upserted + modified;
        const log = `Final batch processed (${modelName}): ${upserted} upserted, ${modified} modified`;
        logs.push(log);
        logger.info(`[${actionId}] ${log}`);
      } catch (err) {
        failed += buffer.length;
        const log = `Final batch failed (${modelName}): ${err.message}`;
        logs.push(log);
        logger.error(`[${actionId}] ${log}`);
      }
    }

    const summary = { success, failed, skipped, logs };
    logger.info(`[${actionId}] Completed CSV stream processing`);
    await onComplete(summary);
    await updateJobStatus(actionId, 'completed', summary);

  } catch (err) {
    logger.error(`[${actionId}] Fatal error in CSV stream: ${err.message}`);
    const summary = { success, failed: failed + buffer.length, skipped, logs: [...logs, `Fatal error: ${err.message}`] };
    await onComplete(summary);
    await updateJobStatus(actionId, 'failed', summary);
  }
}

module.exports = streamAndBatchProcessCSV;
