// Load required packages
var mongoose = require('mongoose');


// Define our user schema
var UserSchema = new mongoose.Schema({
    userName: String,
    password: String,
    email: String,
    registrationDate: { type: Date, default: Date.now },
    facebook: {
        facebookId: Number,
        profileName: String,
        access_token: String
    }
});

//UserSchema.plugin(findOrCreate);

// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);