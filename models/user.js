// Load required packages
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

// Define our user schema
var UserSchema = new mongoose.Schema({
    local:{
        email: String,
        password: String,
    },
    facebook: {
        facebookId: Number,
        profileName: String,
        access_token: String,
        email: String
    },
    global:{
        username: String,
        registrationDate: { type: Date, default: Date.now },
        profilePicture: String,
        score: Number
    }
});

UserSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

UserSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);