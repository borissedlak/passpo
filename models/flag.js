// Load required packages
var mongoose = require('mongoose');
var User = require('./user');

var currentDate = new Date();
var currentTime = currentDate.getTime();

// Define our beer schema
var FlagSchema   = new mongoose.Schema({
    pos: {
        origin: {
            lat: Number,
            long: Number
        },
        destination: {
            lat: Number,
            long: Number
        },
        current: {
            lat: Number,
            long: Number
        }
    },
    points: { type: Number, default: 100},
    validUntil: { type: Number, default: currentTime + (1000 * 60 * 60 * 24 * 2) }, // Current date in milliseconds + 2 days
    owner: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    ownerIcon : String
});

// Export the Mongoose model
module.exports = mongoose.model('Flag', FlagSchema);