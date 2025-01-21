const { body } = require('express-validator');

// Validation rules for checking table availability
exports.checkAvailability = [
    body('partySize').isInt({ min: 1 }).withMessage('Party size must be a positive integer.'),
    body('date').notEmpty().withMessage('Date is required.'),
    body('time').notEmpty().withMessage('Time is required.'),
    body('seatingPreference')
        .optional()
        .isString().withMessage('Seating preference must be a string.')
        .trim()
        .escape(),
    body('restaurantId')
        .notEmpty().withMessage('Restaurant ID is required.')
        .isString().withMessage('Restaurant ID must be a string.')
        .trim()
        .escape(),
];