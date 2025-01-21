const getTables = require('../utils/getTables');
const airtableBase = require('../config/airtable');
const secondsToTime = require('../utils/secondsToTime');
const formatResponse = require('../utils/formatResponse');
const { validationResult } = require('express-validator');
const selectOptimalTable = require('../utils/selectOptimalTable');
const filterAvailableTables = require('../utils/filterAvailableTables');

exports.createBooking = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const {
            customerName,
            customerPhone,
            customerEmail,
            partySize,
            date,
            time,
            seatingPreference,
            specialRequests,
            restaurantId,
        } = req.body;

        // Convert time (HH:MM) to seconds
        const [hours, minutes] = time.split(':').map(Number);
        const bookingTimeInSeconds = hours * 3600 + minutes * 60;

        // Get all tables for the restaurant
        const tables = await getTables(restaurantId);
        // Filter available tables for the requested time slot
        const duration = 7200; // Default duration: 2 hours
        const availableTables = await filterAvailableTables(tables, date, time, duration);

        // Filter tables by party size constraints
        const suitableTables = availableTables.filter(table =>
            partySize >= table.minimum_party &&
            partySize <= table.maximum_party &&
            partySize <= table.capacity
        );

        // Apply seating preference if specified
        let matchingTables = suitableTables;
        if (seatingPreference) {
            matchingTables = suitableTables.filter(table =>
                table.location === seatingPreference
            );
        }

        // Select the optimal table
        const selectedTable = selectOptimalTable(matchingTables, partySize, false);

        if (!selectedTable) {
            return res.status(400).json({
                success: false,
                error: 'No suitable tables available for the requested data.',
                alternativeTimes: ['18:00', '19:30'], // Example alternative times
            });
        }

        // Check if customer exists
        const customerQuery = await airtableBase('Customer_Database')
            .select({
                filterByFormula: `{email} = "${customerEmail}"`,
                maxRecords: 1,
            })
            .firstPage();

        let customerId;

        if (customerQuery.length > 0) {
            // Customer exists
            const existingCustomer = customerQuery[0];
            customerId = existingCustomer.id;

            // Update visit count and last visit
            await airtableBase('Customer_Database').update(customerId, {
                visit_count: (existingCustomer.fields.visit_count || 0) + 1,
                last_visit: new Date().toISOString().split('T')[0],
            });
        } else {
            // Create a new customer
            const newCustomer = await airtableBase('Customer_Database').create({
                name: customerName,
                email: customerEmail,
                phone: customerPhone,
                first_visit: new Date().toISOString().split('T')[0],
                last_visit: new Date().toISOString().split('T')[0],
                visit_count: 1,
                preferred_seating: [seatingPreference],
                status: 'Regular',
            });
            customerId = newCustomer.id;
        }

        // Create booking
        const booking = await airtableBase('Bookings').create({
            customer_id: [customerId],
            party_size: partySize,
            booking_date: date,
            booking_time: bookingTimeInSeconds,
            special_requests: specialRequests,
            table_id: [selectedTable.id], // Use the assigned table ID
            status: 'Confirmed',
            created_by: 'Voice AI',
        });

        return res.status(201).json({
            success: true,
            bookingReference: booking.id,
            confirmedDetails: {
                date,
                time,
                tableAssigned: selectedTable.table_number, // Return table number for customer
                message: 'Your booking has been confirmed. We look forward to seeing you!',
            },
        });
    } catch (error) {
        console.error('Error creating booking:', error);

        return res.status(500).json({
            success: false,
            message: 'An error occurred while creating the booking.',
            error: error.message,
        });
    }
};


exports.checkBooking = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { identifier, restaurantId } = req.body;

    try {
        // Fetch bookings matching the identifier (phone number or booking reference)
        const bookings = await airtableBase('Bookings')
            .select({
                filterByFormula: `
                        OR(
                            {customer_phone} = '${identifier}',
                            RECORD_ID() = '${identifier}'
                        )`
            })
            .all();

        if (bookings.length === 0) {
            return res.json({
                found: false,
                bookings: [],
                message: 'No bookings found for the provided identifier.',
            });
        }

        // Format the bookings
        const formattedBookings = bookings.map(booking => ({
            bookingReference: booking.id,
            date: booking.get('booking_date').split('T')[0], // Format as YYYY-MM-DD
            time: secondsToTime(booking.get('booking_time')), // Convert seconds to HH:MM
            partySize: booking.get('party_size'),
            status: booking.get('status'),
        }));

        res.json({
            found: true,
            bookings: formattedBookings,
            message: 'Bookings successfully retrieved.',
        });
    } catch (error) {
        res.status(500).json({
            found: false,
            bookings: [],
            message: 'Error retrieving bookings.',
            error: error.message,
        });
    }
};

exports.cancelBooking = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { bookingReference, cancellationReason, restaurantId } = req.body;
    try {
        const booking = await airtableBase('Bookings').find(bookingReference);
        const tableId = booking.get('table_id')[0];

        await airtableBase('Bookings').update(bookingReference, { status: 'Cancelled' });
        await airtableBase('Tables').update(tableId, { status: 'Available' });

        res.json(formatResponse(true, null, 'Booking successfully cancelled.'));
    } catch (error) {
        res.status(500).json(formatResponse(false, null, 'Error cancelling booking.', error.message));
    }
};


