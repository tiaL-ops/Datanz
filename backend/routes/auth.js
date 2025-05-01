const express = require('express');
const router = express.Router();
const { connectToDatabase } = require('../../db/database');
const db = connectToDatabase();
const bcrypt = require('bcrypt');
const AuthModel = require('../../db/models/AuthModel');
const authModel = new AuthModel(db);

router.get('/', (req, res) => {
    const type  = req.query.type; //Determine if it's login or signup
    res.render('auth', { type });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try{
        //run sql query to check if credentials match a user in the database
        const user = await authModel.getUserByEmail(email);

        if (user && await authModel.validatePassword(password, user.password)) {
            //Save user info in session
            req.session.user = {
                user_id: user.user_id,
                username: user.username,
                usertype: user.usertype,
                password_changed: user.password_changed
            };

            if (user.usertype === 'government' && user.password_changed === 0) {
                //Redirect to change password page
                return res.redirect('/auth/change-password');
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
        console.error(error);
        res.send('Error logging in');
    }
});

router.get('/change-password', (req, res) => {
    if (!req.session.user){
        return res.redirect('/auth?type=login');
    }
    res.render('change-password');
});

router.post('/change-password', async (req, res) => {
    const { newPassword } = req.body;

    if (!req.session.user){
        return res.redirect('/auth?type=login');
    }

    try {
        // Retrieve current user info 
        const user = await authModel.findByID(req.session.user.user_id);

        if (!user) {
            req.session.message = "User not found!";
            return res.redirect('/auth?type=login');
        }
            //Hash the new password and update the database 
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const updateStmt = db.prepare("UPDATE Auth SET password = ?, password_changed = 1 WHERE user_id = ?");
            updateStmt.run(hashedPassword, user.user_id);

            req.session.user.password_changed = 1;
            req.session.message = "Password changed successfully!";
            return res.redirect('/government');
    } catch (error) {
        console.error(error);
        res.send('Error changing password');
    }
});

router.get('/logout', (req, res) => {
    res.render('auth', { type: 'logout' });
} );


module.exports = router;
