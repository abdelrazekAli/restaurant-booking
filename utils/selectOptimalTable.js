// Helper function to select the optimal table
module.exports = (tables, partySize, approximate) => {
    tables.sort((a, b) => a.capacity - b.capacity);
    for (const table of tables) {
        if (
            partySize >= table.minimum_party &&
            partySize <= table.maximum_party &&
            partySize <= table.capacity
        ) {
            if (approximate && (partySize >= 0.7 * table.capacity)) {
                return table;
            } else { return table }
        }
    }
    return null; // No suitable table found
}
