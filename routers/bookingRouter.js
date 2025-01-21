const express = require('express');
const router = express.Router();
const bookingValidator = require('../validators/bookingValidator');
const bookingController = require('../controllers/bookingController');

router.post('/create-booking', bookingValidator.createBooking, bookingController.createBooking);
router.post('/cancel-booking', bookingValidator.cancelBooking, bookingController.cancelBooking);
router.get('/check-booking', bookingValidator.checkBooking, bookingController.checkBooking);

module.exports = router;