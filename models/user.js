// Load required packages
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// Define our user schema
var UserSchema = new mongoose.Schema({
    local:{
        private password: String,
    },
    facebook: {
        facebookId: Number,
        profileName: String,
        // access_token: String,
        email: String
    },
    global:{
        username: String,
        email: String,
        registrationDate: { type: Date, default: Date.now }
    }
});

UserSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};

UserSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);