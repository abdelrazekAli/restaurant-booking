const airtableBase = require('../config/airtable');
const { validationResult } = require('express-validator');
const selectOptimalTable = require('../utils/selectOptimalTable');
const checkTableAvailability = require('../utils/checkTableAvailability');

exports.checkAvailability = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { partySize, date, time, seatingPreference, restaurantId } = req.body;

    try {
        // Get all tables for the restaurant
        const tables = await airtableBase('Tables')
            .select({

            })
            .firstPage();

        // Filter tables by primary criteria
        const suitableTables = tables
            .map(table => ({
                id: table.id,
                ...table.fields,
            }))
            .filter(table =>
                table.status === 'Available' &&
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

        // Filter available tables for the requested time slot
        const duration = 7200; // Default duration: 2 hours
        const availableTables = [];
        for (const table of matchingTables) {
            const isAvailable = await checkTableAvailability(table.id, date, time, duration);
            if (isAvailable) {
                availableTables.push(table);
            }
        }

        // Select the optimal table
        const selectedTable = selectOptimalTable(availableTables, partySize, true);

        if (!selectedTable) {
            return res.json({
                success: false,
                message: 'No suitable tables available for the requested time.',
                alternativeTimes: ['18:00', '19:30'], // Example alternative times
            });
        }

        res.json({
            success: true,
            availableTables: [{
                time,
                tables: [selectedTable.table_number], // Return the assigned table number
            }],
            message: 'Tables available for booking.',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error checking table availability.',
            error: error.message,
        });
    }
}; exports.checkAvailability2 = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { party_size, date, time, seatingPreference, restaurantId } = req.body.message.tool_calls[0].function.arguments;
    try {
        // Get all tables for the restaurant
        const tables = await airtableBase('Tables')
            .select({

            })
            .firstPage();

        // Filter tables by primary criteria
        const suitableTables = tables
            .map(table => ({
                id: table.id,
                ...table.fields,
            }))
            .filter(table =>
                table.status === 'Available' &&
                party_size >= table.minimum_party &&
                party_size <= table.maximum_party &&
                party_size <= table.capacity
            );

        // Apply seating preference if specified
        let matchingTables = suitableTables;
        if (seatingPreference) {
            matchingTables = suitableTables.filter(table =>
                table.location === seatingPreference
            );
        }

        // Filter available tables for the requested time slot
        const duration = 7200; // Default duration: 2 hours
        const availableTables = [];
        for (const table of matchingTables) {
            const isAvailable = await checkTableAvailability(table.id, date, time, duration);
            if (isAvailable) {
                availableTables.push(table);
            }
        }

        // Select the optimal table
        const selectedTable = selectOptimalTable(availableTables, party_size, true);

        if (!selectedTable) {
            return res.json({
                success: false,
                message: 'No suitable tables available for the requested time.',
                alternativeTimes: ['18:00', '19:30'], // Example alternative times
            });
        }

        res.json({
            success: true,
            availableTables: [{
                time,
                tables: [selectedTable.table_number], // Return the assigned table number
            }],
            message: 'Tables available for booking.',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error checking table availability.',
            error: error.message,
        });
    }
};
