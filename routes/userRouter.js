const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController')

const upload = require('../middleware/upload');

router.patch('/users/:id', upload.single('avatar'), userController.updateUser);

module.exports = router;