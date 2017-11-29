// Load required packages
var mongoose = require('mongoose');
var User = require('./user');
var Item = require('./item');

// Define our userItem schema
var UserItemSchema   = new mongoose.Schema({
    item: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
    user: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    amount: Number
});

// Export the Mongoose model
module.exports = mongoose.model('UserItem', UserItemSchema);