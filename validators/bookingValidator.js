const { body } = require('express-validator');

// Validation rules for creating booking
exports.createBooking = [
    body('customerName').notEmpty().withMessage('Customer name is required.'),
    body('customerPhone').notEmpty().withMessage('Valid phone number is required.'),
    body('customerEmail').isEmail().withMessage('Valid email is required.'),
    body('partySize').isInt({ min: 1 }).withMessage('Party size must be a positive integer.'),
    body('date').notEmpty().withMessage('Booking date is required.'),
    body('time').notEmpty().withMessage('Booking time is required.')
];

// Validation rules for checking booking
exports.checkBooking = [
    body('identifier').notEmpty().withMessage('Identifier is required.'),
    body('restaurantId').notEmpty().withMessage('Restaurant ID is required.')
];

// Validation rules for cancel booking
exports.cancelBooking = [
    body('bookingReference').notEmpty().withMessage('Booking reference is required.'),
    body('cancellationReason').notEmpty().withMessage('Cancellation reason is required.')
];

