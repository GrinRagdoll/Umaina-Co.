const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');

router.post('/register', async (req, res) => {
    try {
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(409).send('An account with that email already exists.');
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const newUser = new User({
            username: req.body.fullName,
            email: req.body.email,
            password: hashedPassword
        });
        await newUser.save();
        console.log('Successfully saved new account for:', newUser.username);
        res.redirect('/webpage1');
    } catch (error) {
        console.error('Failed to save user:', error);
        res.status(500).send('Error creating account.');
    }
});

router.post('/login', async (req, res) => {
    try {
        const foundUser = await User.findOne({ email: req.body.email });
        if (foundUser && await bcrypt.compare(req.body.password, foundUser.password)) {
            req.session.user = {
                username: foundUser.username,
                email: foundUser.email,
                isAdmin: foundUser.isAdmin
            };
            console.log(`Successful login for: ${foundUser.username}`);
            res.redirect('/webpage2');
        } else {
            console.log('Failed login attempt: Invalid credentials.');
            res.send('<script>alert("Invalid email or password!"); window.location.href="/webpage1";</script>');
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Server error during login.');
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/webpage1'));
});

module.exports = router;