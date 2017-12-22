var https = require('https');
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

		/*if(!request.user){
			//console.log(request.user);
			return callback(false,'User data missing');
		}*/
		
		//console.log(request.headers.authorization);

		var postman = request.headers.postman;
		if(postman == "true"){
			var strategy = request.headers.strategy;
			var accessToken = request.headers.authorization;
			var user = request.user;
		}
		else{
			var authentication = JSON.parse(request.headers.authorization);
			var strategy = authentication.strategy;
			var accessToken = authentication.token;
			var user = authentication.user;
		}
		
		var devToken = request.session.dev_token;

		// This may not be a good idea according to below, but it is necessary
		// https://stackoverflow.com/questions/39992774/verify-a-jwt-token-string-containing-bearer-with-nodejs
		accessToken = accessToken.replace('Bearer ', '');

		if (!accessToken || accessToken == null) {
			return callback(false, 'Access Token missing');
		}
		else if (!user || user == null) {
			console.log(user);
			return callback(false, 'User missing');
		}

		switch (strategy) {

			//TODO: Simplify facebook strategie, remove duplicate code
			case 'facebook':

				//The sent token represents the one we have stored in the db after validation
				if (user.facebook.access_token == accessToken) {
					console.log('facebook: 1');
					return callback(user, 'Token matches saved token');
				}
				//Token does not represent the one in the db, we have to validate it again.
				else {
					// Check whether there exists an access token for the application in the session storage
					// The token is needed for the verification of the user's access token, so we definitly know that it was created by our app.
					if (!devToken || devToken == null) {
						console.log('facebook: 2');
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
											if (JSON.parse(chunk).data && JSON.parse(chunk).data.is_valid && JSON.parse(chunk).data.application == config.application_name) {
												User.findOneAndUpdate({ '_id': user._id }, { $set: { 'facebook.access_token': accessToken } }, { new: true }, function (err, doc) {
													if (err)
														return callback(false, JSON.parse({ error: err }));
													else
														return callback(user, JSON.parse(chunk).data);
												});
											}
											else
												return callback(false, JSON.parse(chunk));
										});
									}).on("error", function (e) {
										return callback(false, e.message);
									});

								});
							}).on("error", function (e) {
								return callback(false, e.message);
							});
					}
					else {
						console.log('facebook: 3');
						// Verifies if the users accessToken was created by the facebook application, passed in the devToken
						https.get('https://graph.facebook.com/debug_token?input_token=' + accessToken + '&access_token=' + devToken, function (resp) {
							resp.on('data', function (chunk) {
								//console.log(JSON.parse(chunk).data);
									
								console.log('facebook: 4');
								//If we rename or recreate our facebook App, we need to change the name here
								//Be careful, in the returned json object from facebook it does only contain .data on success, .error otherwise
								if (JSON.parse(chunk).data && JSON.parse(chunk).data.is_valid && JSON.parse(chunk).data.application == 'Mobile')
									return callback(user, JSON.parse(chunk).data);
								else
									return callback(false, JSON.parse(chunk));
							});
						}).on("error", function (e) {
							console.log("Got error: " + e.message);
							return callback(false, e.message);
						});
					}
				}
				//TIME: Path 1 takes around 600ms, whereas Path 2 only takes around 250ms
				break;

			case 'local':
				//catch error if not decodeable
				try{
					var userID = user._id;
				}
				catch(error){console.log("error",error);}

				try{
					var decoded = jwt.decode(accessToken, config.jwt_secret);
					if(decoded.id == userID){
						return callback(user, "Decoded ID matches with user");
					}
					else{
						return callback(false, "Decoded ID represents other user");
					}
				}
				catch(error){
					// It has happened, that even with no (massive) error in the try section, 
					// that errors from the server.js forced the catch section
					return callback(false, "Invalid token, could not decode" + error);
				}
				break;

			default:
				return callback(false, 'Specify a valid strategy (facebook, local), ' + strategy + 'is none!');
		}
	}
}