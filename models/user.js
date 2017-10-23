// Load required packages
var mongoose = require('mongoose');
//var findOrCreate = require('mongoose-findorcreate');


// Define our beer schema
var UserSchema = new mongoose.Schema({
    facebook: {
        facebookId: Number,
        username: String,
        access_token: String
    },
    registrationDate: { type: Date, default: Date.now }
});

//UserSchema.plugin(findOrCreate);

// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);