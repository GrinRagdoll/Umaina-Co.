const mongoose = require('mongoose');

function connectDB() {
    // Uses the cloud database URL when deployed (set as an environment
    // variable), and falls back to your local MongoDB when running on
    // your own laptop.
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/umainaco';

    mongoose.connect(uri)
        .then(() => console.log('Successfully connected to MongoDB!'))
        .catch(err => console.error('MongoDB connection error:', err));
}

module.exports = connectDB;
