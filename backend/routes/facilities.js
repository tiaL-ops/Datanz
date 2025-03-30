const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('Welcome to the facilities page!');
});

router.get('/:id', (req, res) => {
    res.send('Welcome to the facilities:id page!');
});
