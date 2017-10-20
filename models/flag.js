// Load required packages
var mongoose = require('mongoose');
var User = require('./user');

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
    owner: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

// Export the Mongoose model
module.exports = mongoose.model('Flag', FlagSchema);