const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @GET /api/users/search?email=xxx
router.get('/search', protect, async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email query required' });

    const users = await User.find({
      email: { $regex: email, $options: 'i' },
      _id: { $ne: req.user._id }
    }).select('name email').limit(5);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @GET /api/users/profile
router.get('/profile', protect, async (req, res) => {
  res.json(req.user);
});

// @PUT /api/users/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true, runValidators: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
