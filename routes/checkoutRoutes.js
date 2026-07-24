const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const getUserStats = require('../utils/userStats');

// 1. Show Checkout Form
router.get('/checkout/:id', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.redirect('/webpage1');
        }

        const product = await Product.findById(req.params.id);
        if (!product || (product.status !== 'ended' && product.status !== 'sold')) {
            return res.status(404).send('Invalid auction or it has not ended yet.');
        }

        // Ensure only the actual winner can access checkout
        if (product.winner !== req.session.user.username) {
            return res.status(403).send('Access denied. You are not the winner of this auction.');
        }

        const stats = await getUserStats(req.session.user.username);
        res.render('checkout', { product, user: req.session.user, stats });
    } catch (err) {
        console.error('Checkout error:', err);
        res.status(500).send('Server Error');
    }
});

// 2. Submit Shipping & Payment Details
router.post('/checkout/:id', async (req, res) => {
    try {
        console.log('Checkout POST received for product:', req.params.id);
        console.log('Form data:', req.body);

        const { fullName, addressLine, city, postalCode, country, paymentMethod } = req.body;

        const SHIPPING_FEE = 15;
        // Cash on Delivery isn't actually paid yet - only mark it paid for
        // methods that would've gone through an instant payment gateway.
        const paymentStatus = paymentMethod === 'Cash on Delivery' ? 'pending' : 'paid';

        const product = await Product.findByIdAndUpdate(req.params.id, {
            shippingAddress: { fullName, addressLine, city, postalCode, country },
            paymentMethod,
            paymentStatus,
            shippingFee: SHIPPING_FEE,
            orderStatus: 'processing'
        }, { returnDocument: 'after' });

        if (!product) {
            console.log('Checkout failed: no product found for id', req.params.id);
            return res.status(404).send('Product not found during checkout.');
        }

        console.log('Checkout succeeded, redirecting to invoice for:', product._id);
        res.redirect(`/invoice/${product._id}`);
    } catch (err) {
        console.error('Payment submission error:', err);
        res.status(500).send('Server Error');
    }
});

// 3. View Receipt / Invoice
router.get('/invoice/:id', async (req, res) => {
    try {
        if (!req.session.user) return res.redirect('/webpage1');

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send('Invoice not found.');

        const stats = await getUserStats(req.session.user.username);
        res.render('invoice', { product, user: req.session.user, stats });
    } catch (err) {
        console.error('Invoice error:', err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;