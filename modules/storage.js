var User = require('../models/user');
var mongoose = require('mongoose');

var config = JSON.parse(process.env.APP_CONFIG);
var mongoPassword = 'SuperSecure55#!';
var evennodeConnectionString = "mongodb://" + config.mongo.user + ":" + encodeURIComponent(mongoPassword) + "@" + config.mongo.hostString;
var mLabConnectionString = 'mongodb://Basta55:HcAftPbye2@ds121575.mlab.com:21575/api';

module.exports = {
	// Do I need the connection anyhow?
    connect: function () {
		var correctString = (config) ? evennodeConnectionString : mLabConnectionString;
		mongoose.connect(correctString)
	},
	connected: function () {
		return (mongoose.connection.readyState == 1);
	}
	/*findOrCreateUser: function (profile, callback) {
		var user = new User();
		//console.log(profile);
		var query = User.findOne({ 'facebookId': profile.id },
			function (err, result) {
				if (err) {
					console.log("Cannot insert friends to database: " + err);
					return callback(err, null);
				}
				if (result) {
					return callback(err, result);
				}
				else {
					// Set the user properties that came from the POST data
					user.facebookId = profile.id;
					user.username = profile.displayName;

					// Save the user and check for errors
					user.save(function (err) {
						if (err)
							return callback(err, null);
						return callback(err, user);
					});
				}
			}
		);
	}*/
}