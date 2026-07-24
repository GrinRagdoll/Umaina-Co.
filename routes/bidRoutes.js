const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

router.post('/bid', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).send('You must be logged in to bid.');
        }

        const io = req.app.get('io');
        const { productId, amount } = req.body;
        const bidAmount = Number(amount);
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).send('Product not found.');
        }
        if (product.status !== 'active') {
            return res.status(400).send('This auction has already ended.');
        }
        if (bidAmount <= product.currentBid) {
            return res.status(400).send(`Bid must be higher than the current bid of $${product.currentBid}.`);
        }

        const previousHighestBidder = product.highestBidder;
        const newBidder = req.session.user.username;

        product.currentBid = bidAmount;
        product.highestBidder = newBidder;
        product.bids.push({ username: newBidder, amount: bidAmount });

        let justEnded = false;
        if (bidAmount >= product.buyNowPrice) {
            product.status = 'sold';
            product.winner = newBidder;
            justEnded = true;
        }

        await product.save();

        io.to(`product-${productId}`).emit('newBid', {
            productId,
            currentBid: product.currentBid,
            highestBidder: product.highestBidder,
            status: product.status
        });

        if (previousHighestBidder && previousHighestBidder !== newBidder) {
            io.to(`user-${previousHighestBidder}`).emit('notification', {
                type: 'outbid',
                message: `You've been outbid on "${product.name}"! New bid: $${bidAmount} by ${newBidder}.`
            });
        }

        // Single block to handle 'Buy Now' termination events
        if (justEnded) {
            io.to(`product-${productId}`).emit('auctionEnded', {
                productId,
                winner: product.winner,
                finalPrice: product.currentBid,
                reason: 'buyNow'
            });
            io.to(`user-${newBidder}`).emit('notification', {
                type: 'won',
                message: `You bought "${product.name}" instantly at $${product.currentBid}! Click here to checkout.`,
                url: `/checkout/${productId}`
            });
        }

        res.status(200).json({ success: true, status: product.status });
    } catch (error) {
        console.error('Error placing bid:', error);
        res.status(500).send('Error placing bid.');
    }
});

module.exports = router;