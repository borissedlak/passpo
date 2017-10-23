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
var http = require('http');

var passport = require('passport');
var ensureLoggedIn = require('connect-ensure-login');
var FacebookStrategy = require('passport-facebook').Strategy;
var FacebookTokenStrategy = require('passport-facebook-token');
var localStorage = require('localStorage');

// Connect to MongoDB
storage.connect();
mongoose = storage.connect();

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Add cookie parsing functionality to our Express app
app.use(require('cookie-parser')());

//Do I need those?
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
//app.use(session({secret: 'supernova', saveUninitialized: true, resave: true}));
//Morgan prints all HTTP Requests into the CLI - maybe use this for debug reasons
//app.use(require('morgan')('combined'));
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new FacebookStrategy({
	clientID: 605136869876985,
	clientSecret: 'ec15550f963b5415755158a4ed45503a',
	callbackURL: "http://localhost:8080/auth/facebook/callback"
},
	function (accessToken, refreshToken, profile, callback) {
		process.nextTick(function () {
			User.findOne({ 'facebook.facebookId': profile.id },
				function (err, user) {
					/*http.get('graph.facebook.com/debug_token?input_token='+accessToken+'&access_token=app-token', function(resp){
						resp.on('data', function(chunk){
							console.log(JSON.parse(chunk));
						});
					}).on("error", function(e){
						console.log("Got error: " + e.message);
					});*/

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

passport.serializeUser(function (user, cb) {
	cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
	cb(null, obj);
});

app.get('/', function (req, res) {
	res.render('login.ejs');

	/*if (req.user.err) {
		res.status(401).json({
			success: false,
			message: 'Auth failed',
			error: req.user.err
		})
	}
	else if (req.user) {
		const user = { user_id: req.user.id }
		const token = jwt.sign(user, '##########', {
			expiresIn: "30d"
		})
		res.status(200).json({
			success: true,
			message: 'Enjoy your token!',
			token: token,
			user: req.user
		})
	} else {
		res.status(401).json({
			success: false,
			message: 'Auth failed'
		})
	}*/
});

authRouter.get('/facebook', passport.authenticate('facebook'), function (req, res) { res.status(200) });

app.get('/auth/facebook/callback',
	passport.authenticate('facebook', {
		successRedirect: '/profile',
		failureRedirect: '/'
	})
);

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

// route for showing the profile page
app.get('/profile', isLoggedIn, function (req, res) {
	res.render('profile.ejs', {
		user: req.user // get the user out of session and pass to template
	});
});

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
/*app.get('/login', function (req, res) {
	res.render('login');
});*/

// Serve static files in public directory
app.use(express.static(__dirname + '/public'));

app.use('/auth', authRouter);

// Start listening for requests
app.listen(config.port, function () {
	console.log("Listening on port " + config.port);
});

function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}