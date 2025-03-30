const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('Welcome to the government page!');
});

router.get('/sort', (req, res) => {
    res.send('Sort facility data!');
});
