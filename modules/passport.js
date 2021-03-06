var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var config = require('../config/config')
const status_codes = config.http_status_codes;
var User = require('../models/user');

module.exports = function (passport) {

	// =========================================================================
	// FACEBOOK AUTH ===========================================================
	// =========================================================================
	// Defined strategy for the Passport Facebook strategy in this application
	// Login and Signup are handled within on strategy
	passport.use(new FacebookStrategy({
		clientID: process.env.consumer_key,
		clientSecret: process.env.consumer_secret,
		callbackURL: process.env.callback_url
	},
		function (accessToken, refreshToken, profile, callback) {
			process.nextTick(function () {
				User.findOne({ 'facebook.facebookId': profile.id },
					function (err, user) {
						if (err)
							return callback(err, null, { status: status_codes.server_error, message: 'Internal Error' });
						if (user) {
							return callback(null, user, { status: status_codes.success, message: 'User found', token: accessToken });
						}
						else {
							// Set the user properties that came from the POST data
							var newUser = new User();
							newUser.facebook.facebookId = profile.id;
							newUser.global.email = profile.emails[0].value;

							// Save the user and check for errors
							newUser.save(function (err) {
								if (err)
									return callback(err, newUser, { status: status_codes.server_error, message: 'Couldnt insert user' });
								else
									return callback(null, newUser, { status: status_codes.created, message: 'New user inserted', token: accessToken });
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
		//username & password here are shortcuts for req.body.*
		function (req, username, password, done) {
			// asynchronous
			// User.findOne wont fire unless data is sent back
			process.nextTick(function () {
				// find a user whose name is the same as the forms username
				// we are checking to see if the user is trying to signup again
				User.findOne({ 'global.username': username }, function (err, user) {

					if (err) {
						return done(err, null, { status: status_codes.server_error, message: 'Error accessing user db' });
					}
					// check to see if theres already a user with that username
					if (user) {
						return done(null, null, { status: status_codes.bad_request, message: 'Username already registered' });
					}
					else {
						// create the user
						var newUser = new User();

						// set the user's local credentials
						newUser.global.username = username;
						//newUser.global.email = req.body.email;
						newUser.local.password = newUser.generateHash(password);

						// save the user
						newUser.save(function (err) {
							if (err) {
								return done(err, newUser, { status: status_codes.server_error, message: 'Error storing user in db' });
							}
							return done(null, newUser, { status: status_codes.created, message: 'User created' });
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
					return done(err, null, { status: status_codes.server_error, message: 'Error accessing user db' });

				// if no user is found, return the message
				if (!user)
					return done(null, null, { status: status_codes.bad_request, message: 'No user with this name found.' });

				// if the user is found but the password is wrong
				if (!user.validPassword(password))
					return done(null, null, { status: status_codes.bad_request, message: 'Wrong password' });

				// all is well, return successful user
				return done(null, user, { status: status_codes.success, message: 'Logged in' });
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