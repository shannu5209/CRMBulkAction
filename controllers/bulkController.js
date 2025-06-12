const BulkAction = require('../models/BulkAction');
const getQueue = require('../queues/queueFactory');
const path = require('path');

exports.createBulkAction = async (req, res) => {
  try {
    const { entityType, filePath } = req.body;

    if (!filePath || !entityType) {
      req.logger('Missing filePath or entityType', 'warn');
      return res.status(400).json({ error: 'Missing filePath or entityType' });
    }

    const actionId = `bulk_${Date.now()}`;

    await BulkAction.create({
      actionId,
      status: 'queued',
      stats: { success: 0, failed: 0, skipped: 0 },
      logs: []
    });

    const queue = getQueue(entityType);
    await queue.add('bulk-update', { actionId, filePath, entityType });

    req.logger(`Queued job for '${entityType}' with actionId: ${actionId}`);
    res.json({ message: 'Job queued', actionId });
  } catch (err) {
    req.logger(`Failed to create bulk action: ${err.message}`, 'error');
    res.status(500).json({ error: 'Failed to queue bulk action' });
  }
};

exports.getBulkActionStatus = async (req, res) => {
  try {
    const actionId = req.params.id;
    req.logger(`Fetching status for actionId: ${actionId}`);

    const action = await BulkAction.findOne({ actionId });

    if (!action) {
      req.logger(`⚠️ No bulk action found for ID: ${actionId}`, 'warn');
      return res.status(404).json({ error: 'Action not found' });
    }

    res.json(action || { message: "not Found" });
  } catch (err) {
    req.logger(`Failed to get bulk action status: ${err.message}`, 'error');
    res.status(500).json({ error: 'Failed to retrieve status' });
  }
};

exports.getAllBulkActions = async (req, res) => {
  try {
    req.logger('Fetching all bulk actions');
    const actions = await BulkAction.find().sort({ createdAt: -1 });
    res.json(actions || { message: "not Found" });
  } catch (err) {
    req.logger(`Failed to fetch bulk actions: ${err.message}`, 'error');
    res.status(500).json({ error: 'Failed to fetch actions' });
  }
};

exports.getStats = async (req, res) => {
  try {
    req.logger('Fetching all bulk action stats');
    const action = await BulkAction.findOne({ actionId: req.params.id });
    res.json(action?.stats || { message: "not Found" });
  } catch (err) {
    req.logger(`Failed to fetch bulk action stats: ${err.message}`, 'error');
    res.status(500).json({ error: 'Failed to fetch action status' });
  }

};