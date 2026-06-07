const express = require('express');
const router = express.Router();
const { submitApplication, getApplications } = require('../controllers/careerController');

router.post('/', submitApplication);
router.get('/', getApplications);

module.exports = router;
