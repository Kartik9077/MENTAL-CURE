// backend/routes/results.js
const express = require('express');
const router = express.Router();
const Result = require('../models/Result');

// Save result
router.post('/', async (req, res) => {
  try {
    const result = await Result.create(req.body);
    res.status(200).json({ message: 'Result saved', result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save result', error: err });
  }
});

// Get results by user ID
router.get('/:userId', async (req, res) => {
  try {
    const results = await Result.find({ userId: req.params.userId });
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch results', error: err });
  }
});

module.exports = router;