const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const authenticate = require('../middleware/auth');

router.post('/:eventId/register', authenticate, registrationController.registerForEvent);
router.get('/user-registrations', authenticate, registrationController.getUserRegistrations);
router.delete('/:eventId/unregister', authenticate, registrationController.unregisterFromEvent);

module.exports = router;