var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var config = require('../config/config.json')
var User = require('../models/user');

module.exports = function (passport) {

	passport.use(new FacebookStrategy({
		clientID: config.consumer_key,
		clientSecret: config.consumer_secret,
		callbackURL: config.callback_url
	},
		function (accessToken, refreshToken, profile, callback) {
			process.nextTick(function () {
				User.findOne({ 'facebook.facebookId': profile.id },
					function (err, user) {
						if (err)
							return callback(err, null, { status: 401, message: 'Email already registered' });
						if (user)
							return callback(null, user, { status: 200, message: 'User found' });
						else {
							var newUser = new User();

							// Set the user properties that came from the POST data
							newUser.facebook.facebookId = profile.id;
							newUser.facebook.profileName = profile.displayName;
							newUser.facebook.access_token = accessToken;
							newUser.global.username = profile.displayName;
							//newUser.global.profilePicture = profile.picture;

							// Save the user and check for errors
							newUser.save(function (err) {
								if (err)
									return callback(null, newUser, { status: 500, message: 'Couldnt insert user' });
								return callback(null, newUser, { status: 200, message: 'New user inserted' });
							});
						}
					}
				);
			});
		}
	));

	// =========================================================================
	// LOCAL SIGNUP ============================================================
	// =========================================================================
	// we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'

	passport.use('local-signup', new LocalStrategy({
		passReqToCallback: true // allows us to pass back the entire request to the callback
	},
		function (req, username, password, done) {
			// asynchronous
			// User.findOne wont fire unless data is sent back
			process.nextTick(function () {

				// find a user whose name is the same as the forms username
				// we are checking to see if the user is trying to signup again
				User.findOne({ 'global.username': username }, function (err, user) {
					// if there are any errors, return the error
					if (err)
						return done(null, null, { status: 500, message: 'Error accessing user db' });

					// check to see if theres already a user with that username
					if (user) {
						return done(null, null, { status: 401, message: 'Username already registered' });
					}
					else {
						// create the user
						var newUser = new User();

						// set the user's local credentials
						newUser.global.username = username;
						newUser.local.email = req.body.email;
						newUser.local.password = newUser.generateHash(password);

						// save the user
						newUser.save(function (err) {
							if (err)
								throw err;
							return done(null, newUser, { status: 200, message: 'User created' });
						});
					}

				});

			});

		}
	));

	// =========================================================================
	// LOCAL LOGIN =============================================================
	// =========================================================================
	// we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'
	passport.use('local-login', new LocalStrategy({
		passReqToCallback: true
	},
		function (req, username, password, done) {
			// find a user whose email is the same as the forms email
			// we are checking to see if the user trying to login already exists
			User.findOne({ 'global.username': username }, function (err, user) {
				// if there are any errors, return the error before anything else
				if (err)
					return done(err, false, { status: 500, message: 'Error accessing user db' });

				// if no user is found, return the message
				if (!user)
					return done(null, false, { status: 401, message: 'No user with this name found.' });

				// if the user is found but the password is wrong
				if (!user.validPassword(password))
					return done(null, false, { status: 401, message: 'Wrong password' });

				// all is well, return successful user
				return done(null, user, { status: 200, message: 'Logged in' });
			});

		}));

	passport.serializeUser(function (user, done) {
		//console.log("serialize");
		done(null, user._id);
	});

	passport.deserializeUser(function (id, done) {
		//console.log("deserialize");
		User.findOne({ _id: id }, function (err, user) {
			done(null, user);
		});
	});
};