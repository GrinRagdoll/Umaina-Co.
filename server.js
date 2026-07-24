const express = require('express');
const path = require('path');
const session = require('express-session');
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./database/db');
const Product = require('./models/Product');

const pageRoutes = require('./routes/pageRoutes');
const authRoutes = require('./routes/authRoutes');
const bidRoutes = require('./routes/bidRoutes');
const adminRoutes = require('./routes/adminRoutes');
const utilityRoutes = require('./routes/utilityRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 8000;

connectDB();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'umainaco-secret-key-change-this-later',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 2 } // 2 hours
}));

// Make the socket.io instance available to route handlers via req.app.get('io')
app.set('io', io);

app.use('/', pageRoutes);
app.use('/api', authRoutes);
app.use('/api', bidRoutes);
app.use('/', adminRoutes);
app.use('/api', utilityRoutes);
app.use('/', sellerRoutes);
app.use('/', checkoutRoutes);

// ----- SOCKET.IO -----
io.on('connection', (socket) => {
    socket.on('joinProduct', (productId) => {
        socket.join(`product-${productId}`);
    });

    socket.on('registerUser', (username) => {
        if (username) socket.join(`user-${username}`);
    });
});

// ----- BACKGROUND TIMER: close expired auctions automatically -----
setInterval(async () => {
    try {
        const now = new Date();
        const expiredProducts = await Product.find({ status: 'active', endTime: { $lte: now } });

        for (const product of expiredProducts) {
            product.status = 'ended';
            product.winner = product.highestBidder || null;
            await product.save();

            io.to(`product-${product._id}`).emit('auctionEnded', {
                productId: product._id.toString(),
                winner: product.winner,
                finalPrice: product.currentBid,
                reason: 'timeUp'
            });

            if (product.winner) {
                io.to(`user-${product.winner}`).emit('notification', {
                    type: 'won',
                    message: `Time's up! You won the auction for "${product.name}" at $${product.currentBid}!`
                });
            }
        }
    } catch (err) {
        console.error('Error checking expired auctions:', err);
    }
}, 5000);

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});