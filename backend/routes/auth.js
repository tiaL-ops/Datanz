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
            if (user.usertype === 'government' && user.password_changed === 0) {
                //Redirect to change password page
                return res.redirect('/auth?type=change');
            } 
            
            if (user.usertype === 'government') {
                //Redirect to government dashboard
                return res.redirect('/government');
            } else {
                return res.redirect('/facilities');
            }
        }
        else {
            res.send('Invalid username or password');
        }
    } catch (error) {
        console.error(err);
        res.send('Error logging in');
    }
});

router.get('/change-password', (req, res) => {
    if (!req.session.user){
        return res.redirect('/auth?type=login');
    }
    res.render('auth', { type: 'change' });
});

router.post('/change-password', (req, res) => {
    const { newPassword } = req.body;
    if (!req.session.user){
        return res.redirect('/auth?type=login');
    }

    try {
        //update password in database
        const stmt = db.prepare("UPDATE Auth SET password = ?, password_changed = 1 WHERE user_id = ?");
        stmt.run(newPassword, req.session.user.user_id);

        //Update session user info
        req.session.user.password_changed = 1;

        res.redirect('/government');
    } catch (err) {
        console.error(err);
        res.send("Error changing password");
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
} );


module.exports = router;
