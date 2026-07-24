const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const getUserStats = require('../utils/userStats');

async function statsFor(req) {
    if (!req.session.user) return null;
    return await getUserStats(req.session.user.username);
}

router.get('/', async (req, res) => {
    const stats = await statsFor(req);
    res.render('home', { user: req.session.user, stats });
});

router.get('/webpage1', async (req, res) => {
    const stats = await statsFor(req);
    res.render('auth', { user: req.session.user, stats });
});

router.get('/webpage2', async (req, res) => {
    const stats = await statsFor(req);
    const products = await Product.find({});
    res.render('listings', { user: req.session.user, stats, products });
});

router.get('/auction', async (req, res) => {
    const stats = await statsFor(req);
    const product = await Product.findById(req.query.id);
    if (!product) {
        return res.status(404).send('Product not found.');
    }
    res.render('auction', { user: req.session.user, stats, product });
});

router.get('/dashboard', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/webpage1');
    }
    const username = req.session.user.username;
    const stats = await getUserStats(username);
    const wonAuctions = await Product.find({ winner: username }).sort({ endTime: -1 });
    res.render('bidHistory', { user: req.session.user, stats, wonAuctions });
});

module.exports = router;