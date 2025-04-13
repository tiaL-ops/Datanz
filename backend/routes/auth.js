const express = require('express');
const router = express.Router();
const { connectToDatabase } = require('../../db/database');
const db = connectToDatabase();

router.get('/', (req, res) => {
    const type  = req.query.type; //Determine if it's login or signup
    res.render('auth', { type });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    try{
        //run sql query to check if credentials match a user in the database
        const stmt = db.prepare("SELECT * FROM Auth WHERE username = ? AND password = ?");
        const user = stmt.get(username, password);

        if (user) {
            //Save user info in session
            req.session.user = {
                user_id: user.user_id,
                username: user.username,
                usertype: user.usertype
            };
            return res.redirect('/facilities');
        }
        else {
            res.send('Invalid username or password');
        }
    } catch (error) {
        console.error(err);
        res.send('Error logging in');
    }
});

router.post('/signup', (req, res) => {
    const { username, password, email, usertype } = req.body;
    const createdAt = new Date().toISOString();

    try {
        //check if username already exists
        const existingUser = db.prepare("SELECT * FROM Auth WHERE username = ?").get(username);
        if (existingUser) {
            return res.send("Username already exists");
        }
        //check if email already exists
        const existingEmail = db.prepare("SELECT * FROM Auth WHERE email = ?").get(email);
        if (existingEmail) {
            return res.send("Email already exists");
        }
        //check if usertype is valid
        const validUserTypes = ['government', 'user'];
        if (!validUserTypes.includes(usertype)) {
            return res.send("Invalid user type");
        }

        //insert new user into database
        const stmt = db.prepare("INSERT INTO Auth (username, password, email, usertype, created_at) VALUES (?, ?, ?, ?, ?)");
        const info = stmt.run(username, password, email, usertype, createdAt);

        //Save user info in session
        req.session.user = {
            user_id: info.lastInsertRowid,
            username,
            usertype
        };

        res.redirect('/facilities');
    } catch (err) {
        console.error(err);
        res.send("Error creating user");
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
} );


module.exports = router;
