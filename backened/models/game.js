// backend/models/Result.js
const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  userId: String,
  testName: String,
  score: Number,
  correct: Number,
  wrong: Number,
  reactionTime: Number,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Result', resultSchema);