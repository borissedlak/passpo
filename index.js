var url = require('url');
var express = require('express');
var querystring = require('querystring');
var async = require('async');
//var authenticator = require('./authenticator');
var mongoose = require('mongoose');
var storage = require('./storage.js');
var User = require('./models/user');
var Flag = require('./models/flag');
var config = require('./config');
var app = express();
var authRouter = express.Router();
var v1Router = express.Router();
var https = require('https');

var passport = require('passport');
var isLoggedIn = require('connect-ensure-login');
var FacebookStrategy = require('passport-facebook').Strategy;
var FacebookTokenStrategy = require('passport-facebook-token');
var global_access_token;
var global_dev_token;

// Connect to MongoDB
storage.connect();
mongoose = storage.connect();

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Add cookie parsing functionality to our Express app
app.use(require('cookie-parser')());

//Do I need those?
app.use(require('express-session')({ secret: 'my derest secret', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
//app.use(session({secret: 'supernova', saveUninitialized: true, resave: true}));
//Morgan prints all HTTP Requests into the CLI - maybe use this for debug reasons
//app.use(require('morgan')('combined'));
app.use(require('body-parser').urlencoded({ extended: true }));

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
						return callback(err);
					}

					if (user) {
						console.log("Found user")
						return callback(null, user);
					}
					else {
						console.log("creating new user")
						var newUser = new User();

						// Set the user properties that came from the POST data
						newUser.facebook.facebookId = profile.id;
						newUser.facebook.username = profile.displayName;
						newUser.facebook.access_token = accessToken;

						// Save the user and check for errors
						newUser.save(function (err) {
							if (err)
								throw err;
							return callback(null, newUser);
						});
					}
				}
			);
		});
	}
));

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

app.get('/', function (req, res) {

	// IDEA: I get the Id from the debug_token function, so may I use it from there instead of the param
	// --> Every request is handles as if the user is in the db

	storage.isValidRequest(req, function (valid, msg) {

		//console.log(valid);
		//console.log(msg);

		if (valid) {
			return res.status(200).json({ data: msg });
		}
		else {
			return res.status(401).json({ error: msg });
		}
	});
});

app.post('/flag', function (req, res) {
	// Create a new instance of the Beer model
	var flag = new User();

	// Set the beer properties that came from the POST data
	user.facebookId = 123;
	user.username = 'AliBaba';

	// Save the beer and check for errors
	user.save(function (err) {
		if (err) {
			res.send(err);
		}

		res.json({ message: 'User added to the locker!', data: user });
	});
});

authRouter.get('/facebook', passport.authenticate('facebook'), function (req, res) { res.status(200) });

authRouter.get('/facebook/callback', passport.authenticate('facebook',
	{
		successRedirect: '/profile',
		failureRedirect: '/'
	}
));

// Serve static files in public directory
app.use(express.static(__dirname + '/public'));

app.use('/auth', authRouter);

// Start listening for requests
app.listen(config.port, function () {
	console.log("Listening on port " + config.port);
});