const express = require('express');
const app = express();
const PORT = 3000;

// Define a route
app.get('/', (req, res) => {
    res.send('Welcome to Datanz Facility API!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
