const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const getUserStats = require('../utils/userStats');

function requireAdmin(req, res, next) {
    if (!req.session.user || !req.session.user.isAdmin) {
        return res.status(403).send('Admins only.');
    }
    next();
}

async function statsFor(req) {
    if (!req.session.user) return null;
    return await getUserStats(req.session.user.username);
}

// ----- ADMIN PAGES -----

router.get('/admin', requireAdmin, async (req, res) => {
    const stats = await statsFor(req);
    const products = await Product.find({}).sort({ _id: 1 });
    const users = await User.find({});
    res.render('admin', { user: req.session.user, stats, products, users });
});

router.get('/admin/products/:id/edit', requireAdmin, async (req, res) => {
    const stats = await statsFor(req);
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).send('Product not found.');
    }
    res.render('editProduct', { user: req.session.user, stats, product });
});

// ----- PRODUCT MANAGEMENT -----

router.post('/api/admin/products/create', requireAdmin, async (req, res) => {
    try {
        const { name, startingPrice, buyNowPrice, durationHours, imageUrl } = req.body;
        const start = Number(startingPrice);

        await Product.create({
            name,
            startingPrice: start,
            currentBid: start,
            buyNowPrice: buyNowPrice ? Number(buyNowPrice) : start * 2,
            imageUrl: imageUrl || '',
            endTime: new Date(Date.now() + Number(durationHours) * 60 * 60 * 1000),
            status: 'active',
            winner: null,
            bids: []
        });

        res.redirect('/admin');
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).send('Error creating product.');
    }
});

router.post('/api/admin/products/:id/update', requireAdmin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).send('Product not found.');
        }

        product.name = req.body.name;
        product.startingPrice = Number(req.body.startingPrice);
        product.buyNowPrice = Number(req.body.buyNowPrice);
        product.imageUrl = req.body.imageUrl || '';

        if (req.body.durationHours) {
            product.endTime = new Date(Date.now() + Number(req.body.durationHours) * 60 * 60 * 1000);
            if (product.status === 'ended') product.status = 'active';
        }

        await product.save();
        res.redirect('/admin');
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).send('Error updating product.');
    }
});

router.post('/api/admin/products/:id/delete', requireAdmin, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.redirect('/admin');
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).send('Error deleting product.');
    }
});

router.post('/api/admin/products/:id/end-now', requireAdmin, async (req, res) => {
    try {
        const io = req.app.get('io');
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).send('Product not found.');
        }

        product.status = 'ended';
        product.winner = product.highestBidder || null;
        await product.save();

        io.to(`product-${product._id}`).emit('auctionEnded', {
            productId: product._id.toString(),
            winner: product.winner,
            finalPrice: product.currentBid,
            reason: 'adminEnded'
        });

        if (product.winner) {
            io.to(`user-${product.winner}`).emit('notification', {
                type: 'won',
                message: `An admin ended the auction for "${product.name}" early. You won at $${product.currentBid}!`
            });
        }

        res.redirect('/admin');
    } catch (error) {
        console.error('Error ending auction:', error);
        res.status(500).send('Error ending auction.');
    }
});

router.post('/api/admin/products/:id/adjust-bid', requireAdmin, async (req, res) => {
    try {
        const io = req.app.get('io');
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).send('Product not found.');
        }

        const amount = Number(req.body.amount);
        const username = req.body.username || product.highestBidder || 'ADMIN';

        product.currentBid = amount;
        product.highestBidder = username;
        product.bids.push({ username, amount });
        await product.save();

        io.to(`product-${product._id}`).emit('newBid', {
            productId: product._id.toString(),
            currentBid: product.currentBid,
            highestBidder: product.highestBidder,
            status: product.status
        });

        res.redirect(`/admin/products/${product._id}/edit`);
    } catch (error) {
        console.error('Error adjusting bid:', error);
        res.status(500).send('Error adjusting bid.');
    }
});

// ----- USER MANAGEMENT -----

router.post('/api/admin/users/:id/toggle-admin', requireAdmin, async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            return res.status(404).send('User not found.');
        }

        targetUser.isAdmin = !targetUser.isAdmin;
        await targetUser.save();
        res.redirect('/admin');
    } catch (error) {
        console.error('Error toggling admin status:', error);
        res.status(500).send('Error toggling admin status.');
    }
});

router.post('/api/admin/users/:id/delete', requireAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.redirect('/admin');
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Error deleting user.');
    }
});

module.exports = router;