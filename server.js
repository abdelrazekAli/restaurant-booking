const express = require('express');
const cors = require("cors");
const bookingRouter = require('./routers/bookingRouter');
const tableRouter = require('./routers/tablesRouter');
const app = express();

app.use(cors());
app.use(express.json());

// Use routers
app.use('/api', bookingRouter);
app.use('/api', tableRouter);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});