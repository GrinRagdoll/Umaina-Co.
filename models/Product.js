const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    startingPrice: { type: Number, required: true },
    currentBid: { type: Number, required: true },
    buyNowPrice: { type: Number, required: true },
    imageUrl: { type: String, default: '' },
    sellerUsername: { type: String, default: null }, // null = official admin listing
    highestBidder: { type: String, default: null },
    endTime: { type: Date, required: true },
    status: { type: String, enum: ['active', 'sold', 'ended'], default: 'active' },
    winner: { type: String, default: null },
    orderStatus: { type: String, default: 'pending' },
    paymentStatus: { type: String, default: 'unpaid' },
    paymentMethod: { type: String, default: null },
    shippingFee: { type: Number, default: 0 },
    shippingAddress: {
        fullName: { type: String, default: '' },
        addressLine: { type: String, default: '' },
        city: { type: String, default: '' },
        postalCode: { type: String, default: '' },
        country: { type: String, default: '' }
    },
    bids: [{
        username: String,
        amount: Number,
        time: { type: Date, default: Date.now }
    }]
});

module.exports = mongoose.model('Product', productSchema);