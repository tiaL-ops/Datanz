const express = require('express');
const app = express();
const PORT = 3000;

// define the route
app.get('/', (req, res) => {
    res.send('Welcome to Datanz Facility API!');
});

// start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
