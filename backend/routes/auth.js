const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('auth');
});

router.get('/login', (req, res) => {
    res.render('auth');
});

// router.post('/login', (req, res) => {
//     res.send('POST login page!');
// });

router.get('/logout', (req, res) => {
    res.send('In logout page!');
    
} );

router.get('/profile', (req, res) => {
    res.send('In profile page!');
});

module.exports = router;
