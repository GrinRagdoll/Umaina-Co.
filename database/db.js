const mongoose = require('mongoose');

function connectDB() {
    mongoose.connect('mongodb://127.0.0.1:27017/umainaco')
        .then(() => console.log('Successfully connected to MongoDB!'))
        .catch(err => console.error('MongoDB connection error:', err));
}

module.exports = connectDB;
