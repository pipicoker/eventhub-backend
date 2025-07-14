const express = require('express');
const router = express.Router();
const passport = require('passport');
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

// Initiate Google login
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Google callback
router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
  const token = jwt.sign(
    { userId: req.user._id, email: req.user.email },
    process.env.TOKEN_SECRET,
    { expiresIn: '8h' }
  );

  res.cookie('Authorization', `Bearer ${token}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: 8 * 3600000,
  });

  res.redirect(`${process.env.FRONTEND_URL}/google-success`);
});

module.exports = router;