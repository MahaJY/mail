const mongoose = require('mongoose');
const db = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/database2');
        console.log('Connected to MongoDB database');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
};
module.exports = db