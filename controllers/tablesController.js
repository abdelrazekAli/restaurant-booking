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
};

exports.checkAvailability2 = async (req, res) => {
    try {
        // Log the full payload for debugging
        // let data1 = JSON.parse(req.body)
        let data2 = JSON.stringify(req.body)
        console.log('-+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');

        // console.log("Full payload1:", data1.message.tool_calls);
        console.log("Full payload2:", data2.message.tool_calls);
        console.log('-+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');

        // Check if the required fields exist
        if (!req.body.message || !req.body.message.tool_calls || req.body.message.tool_calls.length === 0) {
            return res.status(400).json({ error: true, message: "Invalid request payload: tool_calls missing" });
        }

        // Extract the arguments from the first tool call
        const toolCall = req.body.message.tool_calls[0];

        // Ensure toolCall.function.arguments is an object
        if (typeof toolCall.function.arguments !== 'object') {
            return res.status(400).json({ error: true, message: "Invalid arguments format: expected an object" });
        }

        // Extract the required fields
        const { party_size, date, time, restaurant_id } = toolCall.function.arguments;

        // Validate the extracted data
        if (!party_size || !date || !time || !restaurant_id) {
            return res.status(400).json({ error: true, message: "Missing required fields in arguments" });
        }

        // Log the extracted data
        console.log("Extracted data:", { party_size, date, time, restaurant_id });

        // Get all tables for the restaurant
        const tables = await airtableBase('Tables')
            .select({})
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
        if (toolCall.function.arguments.seatingPreference) {
            matchingTables = suitableTables.filter(table =>
                table.location === toolCall.function.arguments.seatingPreference
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

        // Return success response
        res.json({
            success: true,
            availableTables: [{
                time,
                tables: [selectedTable.table_number], // Return the assigned table number
            }],
            message: 'Tables available for booking.',
        });
    } catch (error) {
        console.error("Error in checkAvailability2:", error);
        res.status(500).json({
            success: false,
            message: 'Error checking table availability.',
            error: error.message,
        });
    }
};