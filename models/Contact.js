const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  age: Number,
});

module.exports = mongoose.model('Contact', ContactSchema);
