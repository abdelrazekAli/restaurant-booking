// Helper function to format API response
module.exports = (success, data, message, error = null) => ({
    success,
    data,
    message,
    error
});