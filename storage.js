var mongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var User = require('./models/user');
var express

var database;
var mLabConnectionString = 'mongodb://Basta55:HcAftPbye2@ds121575.mlab.com:21575/api';
var atlasConnectionString = 'mongodb://bsedlak:TgD1MriqeWApRA8g@capturethemap-shard-00-00-newrz.mongodb.net:27017,capturethemap-shard-00-01-newrz.mongodb.net:27017,capturethemap-shard-00-02-newrz.mongodb.net:27017/test?ssl=true&replicaSet=CaptureTheMap-shard-0&authSource=admin'

module.exports = {
	connect: function () {
		mongoose.connect(mLabConnectionString)
	},
	connected: function () {
		return (mongoose.connection.readyState == 1);
	},
	getFriends: function (userId, cb) {
		var cursor = database.collection('friends').find({
			for_user: userId
		});

		cursor.toArray(cb);
	},
	insertFriends: function (friends) {
		database.collection('friends').insert(friends, function (err) {
			if (err) {
				console.log("Cannot insert friends to database: " + err);
			}
		});
	},
	findOrCreateUser: function (profile, callback) {
		var user = new User();
		var query = User.findOne({ 'username': 'Boris Sedlak' },
			function (err, result) {
				if (err){
					return callback(err, null);
					console.log("Cannot insert friends to database: " + err);
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