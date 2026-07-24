const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Product = require('../models/Product');
const getUserStats = require('../utils/userStats');

// ----- IMAGE UPLOAD CONFIG -----
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/uploads'));
    },
    filename: (req, file, cb) => {
        const safeName = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
        cb(null, safeName);
    }
});
const upload = multer({ storage });

function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).send('You must be logged in to access the seller dashboard.');
    }
    next();
}

// ----- SELLER DASHBOARD PAGE -----
router.get('/seller', requireLogin, async (req, res) => {
    const username = req.session.user.username;
    const stats = await getUserStats(username);
    const items = await Product.find({ sellerUsername: username }).sort({ _id: -1 });

    const activeCount = items.filter(i => i.status === 'active').length;
    const totalRaised = items.reduce((sum, i) => sum + (i.currentBid || 0), 0);

    res.render('seller', {
        user: req.session.user,
        stats,
        items,
        activeCount,
        totalRaised
    });
});

// ----- CREATE A NEW LISTING -----
router.post('/api/seller/items', requireLogin, async (req, res) => {
    try {
        const { name, description, startingBid, durationHours } = req.body;
        const start = Number(startingBid);
        const hours = Number(durationHours) || 24;

        const newItem = await Product.create({
            name,
            description: description || '',
            startingPrice: start,
            currentBid: start,
            buyNowPrice: start * 2,
            imageUrl: '',
            sellerUsername: req.session.user.username,
            endTime: new Date(Date.now() + hours * 60 * 60 * 1000),
            status: 'active',
            winner: null,
            bids: []
        });

        res.status(200).json({ success: true, productId: newItem._id });
    } catch (error) {
        console.error('Error creating seller item:', error);
        res.status(500).json({ success: false });
    }
});

// ----- UPLOAD AN IMAGE FOR ONE OF YOUR OWN LISTINGS -----
router.post('/api/seller/items/:id/upload', requireLogin, upload.single('image'), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Item not found.' });
        }
        if (product.sellerUsername !== req.session.user.username) {
            return res.status(403).json({ success: false, message: 'You can only edit your own listings.' });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image uploaded.' });
        }

        product.imageUrl = '/uploads/' + req.file.filename;
        await product.save();

        res.status(200).json({ success: true, imageUrl: product.imageUrl });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ success: false });
    }
});

// ----- REMOVE YOUR OWN LISTING -----
router.delete('/api/seller/items/:id', requireLogin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Item not found.' });
        }
        if (product.sellerUsername !== req.session.user.username) {
            return res.status(403).json({ success: false, message: 'You can only remove your own listings.' });
        }

        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error removing item:', error);
        res.status(500).json({ success: false });
    }
});

module.exports = router;