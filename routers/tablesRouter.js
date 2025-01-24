const express = require('express');
const router = express.Router();
const tableValidator = require('../validators/tableValidator');
const tablesController = require('../controllers/tablesController');

router.post('/check-availability', tableValidator.checkAvailability, tablesController.checkAvailability);

module.exports = router;