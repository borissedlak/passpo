var User = require('./models/user');
var mongoose = require('mongoose');

var mLabConnectionString = 'mongodb://Basta55:HcAftPbye2@ds121575.mlab.com:21575/api';
var atlasConnectionString = 'mongodb://bsedlak:TgD1MriqeWApRA8g@capturethemap-shard-00-00-newrz.mongodb.net:27017,capturethemap-shard-00-01-newrz.mongodb.net:27017,capturethemap-shard-00-02-newrz.mongodb.net:27017/test?ssl=true&replicaSet=CaptureTheMap-shard-0&authSource=admin'

module.exports = {
	// Do I need the connection anyhow?
    connect: function () {
		mongoose.connect(mLabConnectionString)
	},
	connected: function () {
		return (mongoose.connection.readyState == 1);
	},
	findOrCreateUser: function (profile, callback) {
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
	}
}