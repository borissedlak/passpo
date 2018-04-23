var https = require('https');
var util = require("./util");
var jwt = require('jwt-simple');
var config = require('../config/config');
var User = require('../models/user');

module.exports = {
	/**
	 * Debugging the retreived facebook token to make sure that the request is authenticated
	 * 
	 * https://stackoverflow.com/questions/8605703/how-to-verify-facebook-access-token
	 * https://developers.facebook.com/docs/facebook-login/access-tokens/debugging-and-error-handling
	 */
	isValidRequest: function (request, callback) {


		//console.log(request.headers.authorization);

		var access_token = request.headers.authorization;
		//var user = request.user;
		var strategy = request.headers.strategy;
		var dev_token = request.session.dev_token;


		if (util.isNullOrEmpty(access_token)) {
			return callback(false, 'Access token missing');
		}
		// if (util.isNullOrEmpty(user)) {
		// 	return callback(false, 'User object missing');
		// }
		// if (util.isNullOrEmpty(strategy)) {
		// 	return callback(false, 'Specify authentication strategy eg. facebook or local');
		// }

		// This may not be a good idea according to below, but it is necessary
		// https://stackoverflow.com/questions/39992774/verify-a-jwt-token-string-containing-bearer-with-nodejs
		access_token = access_token.replace('Bearer ', '');

		switch (strategy) {

			case 'facebook':

				var dev_token = request.session.dev_token;

				// Check whether there exists an development token for the application in the session storage
				// The token is needed for the verification of the user's access token, so we definitly know that it was created by this app.
				if (util.isNullOrEmpty(dev_token)) {
					https.get('https://graph.facebook.com/oauth/access_token?grant_type=client_credentials&client_id=' +
						config.consumer_key + '&client_secret=' + config.consumer_secret, function (resp) {
							resp.on('data', function (chunk) {
								dev_token = JSON.parse(chunk).access_token;
								request.session.dev_token = dev_token;

								verifyFacebookToken(access_token, dev_token, user, function (valid, data) {
									return callback(valid, data);
								})
							});
						}).on("error", function (e) {
							return callback(false, e.message);
						});
				}
				else {
					verifyFacebookToken(access_token, dev_token, user, function (valid, data) {
						return callback(valid, data);
					})
				}
				// }
				//TIME: Path 1 takes around 600ms, whereas Path 2 only takes around 250ms
				break;

			case 'local':

				try {
					var decoded_payload = jwt.decode(access_token, config.jwt_secret);
					var user = decoded_payload.user;
					return callback(user, "Valid token");
				}
				catch (error) {
					// It has happened, that even with no (massive) error in the try section, 
					// that errors from the server.js forced the catch section
					return callback(false, "Invalid token, could not decode" + error);
				}
				break;

			default:
				return callback(false, 'Specify a valid strategy (facebook, local), ' + strategy + 'is none!');
		};

		function verifyFacebookToken(access_token, dev_token, user, callback) {
			// Verifies if the users access_token was created by the facebook application, passed in the dev_token
			https.get('https://graph.facebook.com/debug_token?input_token=' + access_token + '&access_token=' + dev_token, function (resp) {
				resp.on('data', function (chunk) {
					var chunkData = JSON.parse(chunk).data;
					console.log(chunkData);
					if (chunkData && chunkData.is_valid && chunkData.app_id == config.consumer_key) {
						return callback(true, JSON.parse(chunk).data);
					}
					else
						return callback(false, JSON.parse(chunk));
				});
			}).on("error", function (e) {
				return callback(false, e.message);
			});
		}
	}
}