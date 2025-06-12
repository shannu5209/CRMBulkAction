const BulkAction = require('../models/BulkAction');
const { v4: uuidv4 } = require('uuid');
const parseCSV = require('../utils/csvImporter');
const getQueue = require('../queues/queueFactory');

exports.createBulkAction = async (req, res) => {
  const { entityType, filePath, scheduledFor } = req.body;
  if (!entityType || !filePath) return res.status(400).json({ error: 'Missing entityType or filePath' });
  //const filePath1 ='./test/data/contacts.csv'
  // const updates = await parseCSV(filePath);
  const actionId = uuidv4();
  await BulkAction.create({
    actionId,
    status: 'queued',
    stats: { success: 0, failed: 0, skipped: 0 },
    logs: []
  });
  req.logger(`aading to queue ActionId-${actionId}`)
  const queue = getQueue(entityType);
  await queue.add('bulk-update', { actionId, filePath }, {
    delay: scheduledFor ? new Date(scheduledFor) - new Date() : 0
  });

  res.json({ message: 'Queued', actionId });
};

exports.getAllBulkActions = async (req, res) => {
  const actions = await BulkAction.find().sort({ createdAt: -1 });
  res.json(actions);
};

exports.getActionStatus = async (req, res) => {
  const action = await BulkAction.findOne({ actionId: req.params.id });
  res.json(action);
};

exports.getStats = async (req, res) => {
  const action = await BulkAction.findOne({ actionId: req.params.id });
  res.json(action?.stats || {});
};
