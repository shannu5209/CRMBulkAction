const app = require('./app');
const { Worker } = require('bullmq');
const Redis = require('ioredis');
const entities = ['contacts']; // Add more as needed

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});


entities.forEach(entity => {
  const redis = new Redis({ maxRetriesPerRequest: null });
  const processor = require(`./jobs/${entity}Processor`);

  new Worker(`bulk-${entity}`, processor, { connection: redis });
});