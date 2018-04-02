// ------------- BASIC INCLUDES ------------->>
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
var path = require('path');

// ------------------------------------------<<

// ------------ SECUTIY INCLUDES ------------>>
/*var session = require('express-session');
var csrf = require('csurf');

app.use(session({
	secret: 'My super session secret',
	cookie: {
		httpOnly: true,
		secure: true
	}
}));

app.use(csrf());

app.use(function (req, res, next) {
	res.locals._csrf = req.csrfToken();
	next();
});*/
// ----------------------------------------<<

// --------- CUSTOM INCLUDES--------------->>
var authenticator = require('./modules/authenticator');
var storage = require('./modules/storage');
var User = require('./models/user');
var util = require('./modules/util');
var config = require('./config/config.json');
require('./modules/passport')(passport); // pass passport for configuration
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
var fileUpload = require('express-fileupload');
app.use(fileUpload());

// ----------------------------------------<<


// ---------- ROUTING --------------------->>
var authRouter = express.Router();
require('./routing/auth_routes')(authRouter, passport);
//Must be below the complete passport setup for some reason
app.use('/auth', authRouter);

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

app.get('/user', function (req, res) {
	authenticator.isValidRequest(req, function (valid, msg) {
		if (valid) {
			User.find(function (err, data) {
				if (err) {
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

// Serve static files in public directory
app.use(express.static(__dirname + '/public'));

// Start listening for requests
var port = process.env.PORT || config.port;
app.listen(port, config.address, function () {
	console.log("Listening on port " + config.port);
});