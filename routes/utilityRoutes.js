const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');

// ----- SEED (run once to populate products) -----
router.get('/seed-products', async (req, res) => {
    const count = await Product.countDocuments();
    if (count > 0) {
        return res.send('Products already seeded. Drop the products collection first if you want to reseed.');
    }

    // Durations in HOURS - varied per product so they end at different times.
    // Feel free to change these numbers.
    const durationsInHours = [1, 2, 3, 4, 1.5, 2.5, 5, 6, 1, 3.5, 2, 4.5];

    const startingProducts = [
        { name: "Vintage Film Camera", startingPrice: 120, imageUrl: "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?w=400" },
        { name: "Pro Gaming Laptop", startingPrice: 850, imageUrl: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400" },
        { name: "Mechanical Keyboard", startingPrice: 95, imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400" },
        { name: "Wireless Headphones", startingPrice: 200, imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400" },
        { name: "Coffee Espresso Machine", startingPrice: 350, imageUrl: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400" },
        { name: "Smart Watch", startingPrice: 150, imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400" },
        { name: "Electric Guitar", startingPrice: 400, imageUrl: "https://images.unsplash.com/photo-1550985616-10810253b84d?w=400" },
        { name: "4K Drone", startingPrice: 600, imageUrl: "https://images.unsplash.com/photo-1508614999368-9260051292e5?w=400" },
        { name: "Collector Comic Book", startingPrice: 80, imageUrl: "https://images.unsplash.com/photo-1608889175638-9e0d3e0b4b0f?w=400" },
        { name: "Designer Sunglasses", startingPrice: 110, imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400" },
        { name: "Leather Messenger Bag", startingPrice: 140, imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400" },
        { name: "Tablet Pro", startingPrice: 500, imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400" }
    ].map((p, i) => ({
        ...p,
        currentBid: p.startingPrice,
        buyNowPrice: p.startingPrice * 2,
        endTime: new Date(Date.now() + durationsInHours[i] * 60 * 60 * 1000),
        status: 'active',
        winner: null
    }));

    await Product.insertMany(startingProducts);
    res.send('Seeded 12 products! You can now visit /webpage2.');
});

// ----- FULL RESET: wipe all bids and give every product a fresh timer -----
router.get('/reset-all', async (req, res) => {
    const durationsInHours = [1, 2, 3, 4, 1.5, 2.5, 5, 6, 1, 3.5, 2, 4.5];
    const products = await Product.find({}).sort({ _id: 1 });

    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        p.currentBid = p.startingPrice;
        p.highestBidder = null;
        p.status = 'active';
        p.winner = null;
        p.bids = [];
        p.orderStatus = 'pending';
        p.paymentStatus = 'unpaid';
        p.paymentMethod = null;
        p.shippingFee = 0;
        p.shippingAddress = { fullName: '', addressLine: '', city: '', postalCode: '', country: '' };
        p.endTime = new Date(Date.now() + durationsInHours[i % durationsInHours.length] * 60 * 60 * 1000);
        await p.save();
    }

    res.send(`Reset ${products.length} products to fresh state with new timers. Visit /webpage2.`);
});

// ----- EXTEND TIMERS ONLY: keep current bids/prices, just add more time -----
router.get('/extend-timers', async (req, res) => {
    const extraHours = Number(req.query.hours) || 2;
    const products = await Product.find({ status: { $in: ['active', 'ended'] } });

    let reactivated = 0;
    for (const p of products) {
        p.endTime = new Date(Date.now() + extraHours * 60 * 60 * 1000);
        if (p.status === 'ended') {
            p.status = 'active';
            reactivated++;
        }
        await p.save();
    }

    res.send(`Extended timers by ${extraHours} hours on ${products.length} products (${reactivated} reactivated). Visit /webpage2.`);
});

// ----- ADMIN BOOTSTRAP -----
// One-time helper: makes a given email the first admin. Only works if no
// admin currently exists yet (so it can't be abused after setup).
router.get('/make-first-admin', async (req, res) => {
    const existingAdminCount = await User.countDocuments({ isAdmin: true });
    if (existingAdminCount > 0) {
        return res.send('An admin already exists. This bootstrap route is now disabled.');
    }

    const email = req.query.email;
    if (!email) {
        return res.status(400).send('Add ?email=your@email.com to the URL.');
    }

    const targetUser = await User.findOne({ email });
    if (!targetUser) {
        return res.status(404).send('No account found with that email. Register first.');
    }

    targetUser.isAdmin = true;
    await targetUser.save();
    res.send(`${targetUser.username} is now an admin. Log out and back in, then visit /admin.`);
});

module.exports = router;