// Load required packages
var mongoose = require('mongoose');


// Define our item schema
var ItemSchema = new mongoose.Schema({
    itemName: String,
    description: String
});

// Export the Mongoose model
module.exports = mongoose.model('Item', ItemSchema);