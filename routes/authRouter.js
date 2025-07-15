const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken')
const authController = require('../controllers/authController');
const { validateSignup, validateLogin } = require('../middleware/validation');

const authenticate = require('../middleware/auth');

router.post('/signup', validateSignup, authController.signup);
router.post('/login', validateLogin, authController.login);
router.post('/logout', authController.logout);
router.get('/profile', authenticate, authController.getUserProfile);
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationEmail);
router.post('/google', authController.googleLogin);


module.exports = router;