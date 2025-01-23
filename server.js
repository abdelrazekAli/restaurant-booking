const express = require('express');
const cors = require("cors");
const bookingRouter = require('./routers/bookingRouter');
const tableRouter = require('./routers/tablesRouter');
const app = express();

app.use(cors());
app.use(express.json());


// Middleware to log request details
app.use((req, res, next) => {
    console.log('--- New Request ---');
    // console.log('Method:', req.method);
    // console.log('URL:', req.url);
    // console.log('Body:', req.body);
    console.log('--- ------------- ---');

    // console.log('Headers:', req.headers);

    // Log the body (if available)
    if (req.body && Object.keys(req.body).length > 0) {
        // console.log('Body:', req.body);
    } else {
        console.log('Body: No body data');
    }
    console.log('-------------------');

    next(); // Pass control to the next middleware
});

// Use routers
app.use('/api', bookingRouter);
app.use('/api', tableRouter);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});