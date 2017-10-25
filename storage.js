var mongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var User = require('./models/user');
var https = require('https');
var config = require('./config');

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
	},
	/**
	 * Debugging the retreived facebook token to make sure that the request is authenticated
	 * 
	 * https://stackoverflow.com/questions/8605703/how-to-verify-facebook-access-token
	 * https://developers.facebook.com/docs/facebook-login/access-tokens/debugging-and-error-handling
	 */
	isValidRequest: function (request, callback) {

		/*if(!request.user){
			//console.log(request.user);
			return callback(false,'User data missing');
		}*/

		var accessToken = request.headers.authorization;
		var devToken = request.session.dev_token;

		//console.log(!request.session.dev_token);

		// This may not be a good idea according to below, but it is necessary
		// https://stackoverflow.com/questions/39992774/verify-a-jwt-token-string-containing-bearer-with-nodejs
		accessToken = accessToken.replace('Bearer ', '');

		// Check whether there exists an access token for the application in the session storage
		// The token is needed for the verification of the user's access token, so we definitly know that it was created by our app.
		if (!devToken || devToken == null) {
			console.log('Path 1');
			https.get(
				'https://graph.facebook.com/oauth/access_token?grant_type=client_credentials&client_id=' +
				config.consumer_key + '&client_secret=' + config.consumer_secret
				, function (resp) {
					resp.on('data', function (chunk) {
						devToken = JSON.parse(chunk).access_token;
						request.session.dev_token = JSON.parse(chunk).access_token;

						//console.log('https://graph.facebook.com/debug_token?input_token='+accessToken+'&access_token='+devToken);

						// Verifies if the users accessToken was created by the facebook application, passed in the devToken
						https.get('https://graph.facebook.com/debug_token?input_token=' + accessToken + '&access_token=' + devToken, function (resp) {
							resp.on('data', function (chunk) {
								//console.log(JSON.parse(chunk).data);

								//TODO: Need to rename the json parse variables, but there's a problem with stringifying and parsing them
								// Also it is not a good idea to have the same code twice: here and below in the else

								//If we rename or recreate our facebook App, we need to change the name here
								//Be careful, in the returned json object from facebook it does only contain .data on success, .error otherwise
								if (JSON.parse(chunk).data && JSON.parse(chunk).data.is_valid && JSON.parse(chunk).data.application == 'Mobile')
									return callback(true, JSON.parse(chunk).data);
								else
									return callback(false, JSON.parse(chunk));
							});
						}).on("error", function (e) {
							console.log("Got error: " + e.message);
							return callback(false, e.message);
						});

					});
				}).on("error", function (e) {
					console.log("Got error: " + e.message);
					return callback(false, e.message);
				});
		}
		else {
			console.log('Path 2');

			// Verifies if the users accessToken was created by the facebook application, passed in the devToken
			https.get('https://graph.facebook.com/debug_token?input_token=' + accessToken + '&access_token=' + devToken, function (resp) {
				resp.on('data', function (chunk) {
					//console.log(JSON.parse(chunk).data);

					//If we rename or recreate our facebook App, we need to change the name here
					//Be careful, in the returned json object from facebook it does only contain .data on success, .error otherwise
					if (JSON.parse(chunk).data && JSON.parse(chunk).data.is_valid && JSON.parse(chunk).data.application == 'Mobile')
						return callback(true, JSON.parse(chunk).data);
					else
						return callback(false, JSON.parse(chunk));
				});
			}).on("error", function (e) {
				console.log("Got error: " + e.message);
				return callback(false, e.message);
			});
		}

		//TIME: Path 1 takes around 500-1500ms, whereas Path 2 only takes < 200ms :)
	}
}