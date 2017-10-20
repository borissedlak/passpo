// Load required packages
var mongoose = require('mongoose');

// Define our beer schema
var UserSchema   = new mongoose.Schema({
    facebookId: Number,
    username: String,
    registrationDate : { type : Date, default: Date.now }
});

// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);