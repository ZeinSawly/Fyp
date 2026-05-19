const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authenticationController');
const { verifyToken } = require('../middlewares/authMiddleware');


router.post('/login', login);

router.post('/logout', verifyToken, (req, res) => {
    // Logs the logout event for the specific user
    console.log(`User ${req.user.id} logged out at ${new Date().toISOString()}`);
    res.status(200).json({ message: 'Logout recorded' });
});

router.get('/verify', verifyToken, (req, res) => {
    res.status(200).json({ valid: true, user: req.user });
  });

module.exports = router;