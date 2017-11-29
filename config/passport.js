var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var config = require('../config/config.json')
var User = require('../models/user');

module.exports = function (passport) {

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

	passport.use(new FacebookStrategy({
		clientID: config.consumer_key,
		clientSecret: config.consumer_secret,
		callbackURL: config.callback_url
	},
		function (accessToken, refreshToken, profile, callback) {
			process.nextTick(function () {
				User.findOne({ 'facebook.facebookId': profile.id },
					function (err, user) {
						if (err) {
							console.log("Cannot insert user to database: " + err);
							return callback(err, null, { status: 401, message: 'Email already registered' });
						}

						if (user) {
							console.log("Found user")
							return callback(null, user, { status: 200, message: 'User found' });
						}
						else {
							console.log("creating new user")
							var newUser = new User();

							// Set the user properties that came from the POST data
							newUser.facebook.facebookId = profile.id;
							newUser.facebook.profileName = profile.displayName;
							newUser.facebook.access_token = accessToken;

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
		// by default, local strategy uses username and password, we will override with email
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true // allows us to pass back the entire request to the callback
	},
		function (req, email, password, done) {

			// asynchronous
			// User.findOne wont fire unless data is sent back
			process.nextTick(function () {

				// find a user whose email is the same as the forms email
				// we are checking to see if the user trying to login already exists
				User.findOne({ 'local.email': email }, function (err, user) {
					// if there are any errors, return the error
					if (err)
						return done(err);

					// check to see if theres already a user with that email
					if (user) {
						return done(null, null, { status: 401, message: 'Email already registered' });
					} else {

						// if there is no user with that email
						// create the user
						var newUser = new User();

						// set the user's local credentials
						newUser.local.email = email;
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
		// by default, local strategy uses username and password, we will override with email
		usernameField: 'email',
		passwordField: 'password',
		passReqToCallback: true // allows us to pass back the entire request to the callback
	},
		function (req, email, password, done) { // callback with email and password from our form

			// find a user whose email is the same as the forms email
			// we are checking to see if the user trying to login already exists
			User.findOne({ 'local.email': email }, function (err, user) {
				// if there are any errors, return the error before anything else
				if (err)
					return done(err);

				// if no user is found, return the message
				if (!user)
					return done(null, null, { status: 401, message: 'No user found.' });

				// if the user is found but the password is wrong
				if (!user.validPassword(password))
					return done(null, null, { status: 401, message: 'No user found.' });

				// all is well, return successful user
				return done(null, user, { status: 200, message: 'Logged in' });
			});

		}));
};