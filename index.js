var url = require('url');
var express = require('express');
var querystring = require('querystring');
var async = require('async');
var authenticator = require('./authenticator');
var mongoose = require('mongoose');
var storage = require('./storage.js');
var User = require('./models/user');
var config = require('./config');
var app = express();
var authRouter = express.Router();

var passport = require('passport');
var ensureLoggedIn = require('connect-ensure-login');
var FacebookStrategy = require('passport-facebook').Strategy;

// Connect to MongoDB
storage.connect();
mongoose = storage.connect();

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Add cookie parsing functionality to our Express app
app.use(require('cookie-parser')());

//Do I need those?
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
//Morgan prints all HTTP Requests into the CLI - maybe use this for debug reasons
//app.use(require('morgan')('combined'));
app.use(require('body-parser').urlencoded({ extended: true }));

app.get('/', function (req, res) {
	res.redirect('/login');
});

// Take user to Twitter's login page
authRouter.get('/twitter', authenticator.redirectToTwitterLoginPage);

passport.use(new FacebookStrategy({
	clientID: 605136869876985,
	clientSecret: 'ec15550f963b5415755158a4ed45503a',
	callbackURL: "http://localhost:8080/auth/facebook/callback"
},
	function (accessToken, refreshToken, profile, cb) {
		//console.log(profile);
		storage.findOrCreateUser(profile, function (err, user) {
			return cb(err, user);
		});
	}
));

app.post('/', function (req, res) {
	// Create a new instance of the Beer model
	var user = new User();

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

passport.serializeUser(function (user, cb) {
	cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
	cb(null, obj);
});

app.use(passport.initialize());
app.use(passport.session());

authRouter.get('/facebook',
	passport.authenticate('facebook')
);

authRouter.get('/facebook/callback',
	passport.authenticate('facebook', { failureRedirect: '/login' }),
	function (req, res) {
		console.log("Successful authenticated");
		res.redirect('/profile');
	}
);

app.get('/profile',
	ensureLoggedIn.ensureLoggedIn(),
	function (req, res) {
		res.render('profile', { user: req.user });
	}
);

// Main page handler
app.get('/neverdothat', function (req, res) {
	if (!req.cookies.access_token || !req.cookies.access_token_secret || !req.cookies.twitter_id) {
		return res.redirect('/login');
	}

	// If the app couldn't connect to the database, get data from Twitter's API
	if (!storage.connected()) {
		return renderMainPageFromTwitter(req, res);
	}

	storage.getFriends(req.cookies.twitter_id, function (err, friends) {
		if (err) {
			return res.status(500).send(err);
		}

		if (friends.length > 0) {
			console.log("Data loaded from MongoDB");

			// Sort the friends alphabetically by name
			friends.sort(function (a, b) {
				return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
			});

			// Render the main application
			res.render('index', {
				friends: friends
			});
		} else {
			renderMainPageFromTwitter(req, res);
		}
	});
});

// Show the login page
app.get('/login', function (req, res) {
	res.render('login');
});

// Serve static files in public directory
app.use(express.static(__dirname + '/public'));

app.use('/auth', authRouter);

// Start listening for requests
app.listen(config.port, function () {
	console.log("Listening on port " + config.port);
});