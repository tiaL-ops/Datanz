const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    const type  = req.query.type; //Determine if it's login or signup
    res.render('auth', { type });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Check user credentials 
    if (username === "user" && password === "password") {
        req.session.user = { username };
        return res.redirect('/facilities');
    }
    
    res.send("Invalid login credentials");
});

router.post('/signup', (req, res) => {
    const { username, password } = req.body;

    req.session.user = { username };
    res.redirect('/facilities');
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
} );


module.exports = router;
