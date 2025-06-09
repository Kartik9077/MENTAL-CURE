const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Signup Route
router.post('/signup', async (req, res) => {
    console.log('Received signup request:', req.body); // 🔍 Add this
    try {
        const { name, email, password } = req.body;

        const newUser = new User({ name, email, password });
        await newUser.save();

        console.log('User saved:', newUser); // 🔍 Add this
        res.status(200).json({ message: 'Signup successful' });
    } catch (error) {
        console.error('Signup error:', error); // 🔍 Add this
        res.status(500).json({ message: 'Server error' });
    }
});


// Login Route
router.post('/login', async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await User.findOne({ name, password });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    res.status(500).json({ message: 'Login error', error });
  }
});

// Update Score
router.post('/update-score/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const updatedScores = req.body; // { perceptionTest: 80, ... }
    const user = await User.findByIdAndUpdate(userId, { $set: { scoreBoard: updatedScores } }, { new: true });
    res.status(200).json({ message: 'Score updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Error updating score', err });
  }
});
router.put('/profile/password', jwtauthmidddle, async (req, res) => {
    try {
        const userid = req.user.id; // Extract the id from the token
        const { currentpassword, newpassword } = req.body; // Extract current and new passwords from request body
        console.log(currentpassword,'this is new password',newpassword)
        // Check if currentPassword and newPassword are present in the request body
        if (!currentpassword || !newpassword) {
            return res.status(400).json({ error: 'Both currentPassword and newPassword are required' });
        }

        // Find the user by userid
        const user = await User.findById(userid);

        // If user does not exist or password does not match, return error
        if (!user || !(await user.comparepassword(currentpassword))) {
            return res.status(401).json({ error: 'Invalid current password' });
        }

        // Update the user's password
        user.password = newpassword;
        await user.save();

        console.log('password updated');
        res.status(200).json({ message: 'Password updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


module.exports = router;
