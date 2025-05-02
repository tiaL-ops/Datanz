const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { connectToDatabase } = require('../../db/database');
const db = connectToDatabase();
const AuthModel = require('../../db/models/AuthModel');
const authModel = new AuthModel(db);

// GET form
router.get('/create-user', (req, res) => {
    res.render('create-user'); // make sure you have create-user.ejs or .html
});

// POST to create new user
router.post('/create-user', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await authModel.createUser(username, email, hashedPassword, 'government');
        res.send(`User created successfully! ID: ${newUser.user_id}`);
    } catch (err) {
        console.error(err);
        res.send('Error creating user. Email might already exist.');
    }
});

module.exports = router;
