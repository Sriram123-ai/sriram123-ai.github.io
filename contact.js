const express = require('express');
const router = express.Router();
const { submitContact, getMessages } = require('../controllers/contactController');

router.post('/', submitContact);
router.get('/', getMessages); // For admin/testing

module.exports = router;
