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
        console.log("Full payload:", JSON.stringify(req.body, null, 2));

        // Check if the required fields exist
        if (!req.body.message || !req.body.message.toolCalls || req.body.message.toolCalls.length === 0) {
            return res.status(400).json({ error: true, message: "Invalid request payload: toolCalls missing" });
        }

        // Extract the arguments from the first tool call
        const toolCall = req.body.message.toolCalls[0];
        const arguments = JSON.parse(toolCall.function.arguments); // Parse the JSON string

        // Extract the required fields
        const { partySize, date, time, restaurantId } = arguments;

        // Validate the extracted data
        if (!partySize || !date || !time || !restaurantId) {
            return res.status(400).json({ error: true, message: "Missing required fields in arguments" });
        }

        // Log the extracted data
        console.log("Extracted data:", { partySize, date, time, restaurantId });

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
                partySize >= table.minimum_party &&
                partySize <= table.maximum_party &&
                partySize <= table.capacity
            );

        // Apply seating preference if specified
        let matchingTables = suitableTables;
        if (arguments.seatingPreference) {
            matchingTables = suitableTables.filter(table =>
                table.location === arguments.seatingPreference
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
