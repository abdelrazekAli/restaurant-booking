const airtableBase = require('../config/airtable');

// Helper function to get all tables for a restaurant
module.exports = async () => {
    const tables = await airtableBase('Tables')
        .select({
            filterByFormula: `{status} = "Available"`,
        })
        .firstPage();
    return tables.map(table => ({
        id: table.id,
        ...table.fields,
    }));
}