// ------------ BASIC INCLUDES ------------>>
//var url = require('url');
var express = require('express');
var app = express();
//CORS is about whether the express server allows requests from different servers.
//https://stackoverflow.com/questions/7067966/how-to-allow-cors
var cors = require('cors');
var bodyParser = require('body-parser');
//var querystring = require('querystring');
//var async = require('async');
var fs = require('fs');
var mongoose = require('mongoose');
var https = require('https');
var passport = require('passport');
// ----------------------------------------<<

// --------- CUSTOM INCLUDES--------------->>
var authenticator = require('./authenticator');
var storage = require('./storage.js');
var User = require('./models/user');
var Flag = require('./models/flag');
var Item = require('./models/item');
var UserItem = require('./models/userItem');
var config = require('./config/config.json');
require('./config/passport')(passport); // pass passport for configuration
// ----------------------------------------<<

// ---------- ROUTING --------------------->>
var authRouter = express.Router();

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
app.use(cors());
storage.connect();
//mongoose.connect(configDB.url); // connect to our database
app.use(require('express-session')({ secret: 'my derest secret', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
//Morgan prints all HTTP Requests into the CLI - maybe use this for debug reasons
//app.use(require('morgan')('combined'));
//parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
//Without the correct setup body parser it is not possible to deserialize json bodies
app.use(bodyParser.json());
// ----------------------------------------<<


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

app.post('/points', function (req, res) {
	authenticator.isValidRequest(req, function(valid, msg){
		if (valid) {
			//console.log("Valid", req.headers.authorization, msg);
			return res.status(200).json({message: 'Valid request'});
		}
		else {
			//console.log("Invalid", req.headers.authorization, msg);
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

//LOGIN
//successful: redirect to main page, respond with status code 200
//unsuccessful: stay on login site, display error message, respond with status code 401
authRouter.post('/login', function(req, res){
	passport.authenticate('local-login', function (err, user, info) {
		//console.log(err,user,info);
		res.status(info.status).json({user:user, info:info});
	//Notice that when you pass parameters to a deeper function you have to include the reference at the end as below
	})(req, res);
});

//REGISTRATION
//successful: redirect to login page, respond with status code 200
//unsuccessful: stay on registration site, display error message, respond with status code 400|401
authRouter.post('/signup', function(req, res){
	passport.authenticate('local-signup', function (err, user, info) {
		//console.log(err,user,info);
		res.status(info.status).json({user:user, info:info});
	//Notice that when you pass parameters to a deeper function you have to include the reference at the end as below
	})(req, res);
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