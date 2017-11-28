// ------------ BASIC INCLUDES ------------>>
//var url = require('url');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
//var querystring = require('querystring');
//var async = require('async');
var fs = require('fs');
var mongoose = require('mongoose');
var https = require('https');
var passport = require('passport');
//var isLoggedIn = require('connect-ensure-login');
var FacebookStrategy = require('passport-facebook').Strategy;
// ----------------------------------------<<

// --------- CUSTOM INCLUDES--------------->>
var authenticator = require('./authenticator');
var storage = require('./storage.js');
var User = require('./models/user');
var Flag = require('./models/flag');
var config = require('./config');
// ----------------------------------------<<

// ---------- ROUTING --------------------->>
var authRouter = express.Router();
//var v1Router = express.Router();

//HTTPS forcing
/*var httpsOptions = {
	key: fs.readFileSync('./ssl-key.pem'),
	cert: fs.readFileSync('./ssl-cert.pem')
};
var https = express(httpsOptions);
https.all('*', function(req, res) {
	console.log("HTTPS: " + req.url);
	return res.send(400).json({error:"HTTP is not supported, use HTTPS instead"});
});*/
// ----------------------------------------<<

// ------ EXTENDED INCLUDES / SETUP ------->>
//Allows JSON cookie parsing functionality
app.use(require('cookie-parser')());
// One possible templating engine for js
//app.set('view engine', 'ejs');
storage.connect();
app.use(require('express-session')({ secret: 'my derest secret', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
//Morgan prints all HTTP Requests into the CLI - maybe use this for debug reasons
//app.use(require('morgan')('combined'));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
//Without the correct setup body parser it is not possible to deserialize json bodies
app.use(bodyParser.json());
// ----------------------------------------<<

passport.use(new FacebookStrategy({
	clientID: config.consumer_key,
	clientSecret: config.consumer_secret,
	callbackURL: config.callback_url
},
	function (accessToken, refreshToken, profile, callback) {
		process.nextTick(function () {
			// TODO: Use storage.findOrCreateUser Method instead
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
						newUser.facebook.profileName = profile.displayName;
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

	authenticator.isValidRequest(req, function (valid, msg) {
		if (valid) {
			return res.status(200).json({ data: msg });
		}
		else {
			return res.status(401).json({ error: msg });
		}
	});
});

app.get('/flag', function (req, res) {
	authenticator.isValidRequest(req, function(valid, msg){
		if (valid) {
			Flag.find(function (err,data){
				if(err){
					return res.status(500).json(error);
				}
				res.status(200).json(data);
			});
		}
		else {
			return res.status(401).json({ error: msg });
		}
	});
});

app.get('/user', function (req, res) {
	authenticator.isValidRequest(req, function(valid, msg){
		if (valid) {
			User.find(function (err,data){
				if(err){
					return res.status(500).json(error);
				}
				res.status(200).json(data);
			});
		}
		else {
			return res.status(401).json({ error: msg });
		}
	});
});

app.post('/flag', function (req, res) {
	authenticator.isValidRequest(req, function(valid, msg){
		// #1 Make sure the post request contains a valid facebook token
		if (valid) {
			// #2 Make sure the POST contains a correct flag body
			if(!req.body.flag || req.body.flag == null){
				return res.status(400).json({error: "Flag Body missing"});
			}
			var flagInputObject = req.body.flag;
			var flag = new Flag();
			flag.pos = flagInputObject.pos;
			flag.owner = flagInputObject.owner;
			
			flag.save(function (err) {
				if (err) {
					return res.status(500).send(err);
				}
		
				res.status(201).json({ message: 'Flag added to the db', data: flag });
			});
		}
		else {
			return res.status(401).json({ error: msg });
		}
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