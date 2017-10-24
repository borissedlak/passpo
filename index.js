var url = require('url');
var express = require('express');
var querystring = require('querystring');
var async = require('async');
//var authenticator = require('./authenticator');
var mongoose = require('mongoose');
var storage = require('./storage.js');
var User = require('./models/user');
var config = require('./config');
var app = express();
var authRouter = express.Router();
var https = require('https');

var passport = require('passport');
var isLoggedIn = require('connect-ensure-login');
var FacebookStrategy = require('passport-facebook').Strategy;
var FacebookTokenStrategy = require('passport-facebook-token');
var localStorage = require('localStorage');
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
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
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
			//storage.validateFacebookToken(accessToken, dev_token);
			User.findOne({ 'facebook.facebookId': profile.id },
				function (err, user) {
					if (err) {
						console.log("Cannot insert user to database: " + err);
						return callback(err);
					}

					if (user) {
						console.log("Found user")
						//console.log(user);
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
	User.findOne({_id: id}, function(err, user){
		done(null, user);
	});
});

app.get('/', function (req, res) {

	console.log('home');

	if(!req.user){
		res.render('login.ejs');
	}
	else{
		res.redirect('/profile')
	}
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

app.get('/auth/facebook/callback', passport.authenticate('facebook', {
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
app.get('/profile', function (req, res) {
	console.log('profile');
	storage.isValidRequest(req, function(valid, msg){

		console.log(valid);
		console.log(msg);

		if(valid && req.user){
			//console.log(req.user);
			res.render('profile.ejs', {
				user: req.user // get the user out of session and pass to template
			});
		}
		else{
			//Redirect to error and display special message
			console.log(msg);
			res.redirect('/');
		}
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