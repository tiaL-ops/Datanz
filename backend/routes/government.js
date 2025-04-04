const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    const data = {
        facilities: ['one', 'two', 'three'],
        workers: ['nora', 'landy', 'omi']
    };
    res.render('government', data);
});

router.get('/facilities', (req, res) => {
    res.send('In facilities page!');
});

module.exports = router;
