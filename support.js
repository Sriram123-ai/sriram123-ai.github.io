const express = require('express');
const router = express.Router();
const { submitSupport, getTickets } = require('../controllers/supportController');

router.post('/', submitSupport);
router.get('/', getTickets);

module.exports = router;
