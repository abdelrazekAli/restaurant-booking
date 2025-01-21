const airtableBase = require('../config/airtable');

// Helper function to filter available tables
module.exports = async (tables, date, time, duration) => {
    const availableTables = [];
    for (const table of tables) {
        const isAvailable = await checkTableAvailability(table.id, date, time, duration);
        if (isAvailable) {
            availableTables.push(table);
        }
    }
    return availableTables;
}

// Helper function to check table availability
async function checkTableAvailability(tableId, date, time, duration) {
    const bookings = await airtableBase('Bookings')
        .select({
            filterByFormula: `AND(
                {table_id} = "${tableId}",
                {booking_date} = "${date}",
                {status} != "Cancelled"
            )`,
        })
        .firstPage();

    // Convert time to seconds for comparison
    const [hours, minutes] = time.split(':').map(Number);
    const bookingStartTime = hours * 3600 + minutes * 60;
    const bookingEndTime = bookingStartTime + duration;

    // Check for overlapping bookings
    for (const booking of bookings) {
        const bookingTime = booking.fields.booking_time;
        const bookingDuration = booking.fields.duration || 7200; // Default duration: 2 hours
        const existingStartTime = bookingTime;
        const existingEndTime = existingStartTime + bookingDuration;

        if (
            (bookingStartTime >= existingStartTime && bookingStartTime < existingEndTime) ||
            (bookingEndTime > existingStartTime && bookingEndTime <= existingEndTime) ||
            (bookingStartTime <= existingStartTime && bookingEndTime >= existingEndTime)
        ) {
            return false; // Table is not available
        }
    }
    return true; // Table is available
}