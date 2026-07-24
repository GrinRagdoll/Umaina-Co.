const Product = require('../models/Product');

async function getUserStats(username) {
    if (!username) {
        return { activeBids: 0, wins: 0, losses: 0, bidHistory: [] };
    }

    const productsBidOn = await Product.find({ 'bids.username': username });

    let activeBids = 0;
    let wins = 0;
    let losses = 0;
    const bidHistory = [];

    productsBidOn.forEach(p => {
        const userBids = p.bids.filter(b => b.username === username);
        userBids.forEach(b => {
            bidHistory.push({
                productName: p.name,
                productId: p._id.toString(),
                amount: b.amount,
                time: b.time,
                status: p.status
            });
        });

        if (p.status === 'active') {
            activeBids++;
        } else if (p.winner === username) {
            wins++;
        } else {
            losses++;
        }
    });

    bidHistory.sort((a, b) => new Date(b.time) - new Date(a.time));

    return { activeBids, wins, losses, bidHistory };
}

module.exports = getUserStats;