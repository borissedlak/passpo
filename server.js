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

/** bodyParser.urlencoded(options)
 * Parses the text as URL encoded data (which is how browsers tend to send form data from regular forms set to POST)
 * and exposes the resulting object (containing the keys and values) on req.body
 */
app.use(bodyParser.urlencoded({
    extended: true
}));

/**bodyParser.json(options)
 * Parses the text as JSON and exposes the resulting object on req.body.
 */
app.use(bodyParser.json());

// ----------------------------------------<<


// ---------- ROUTING --------------------->>
var authRouter = express.Router();
var apiRouter = express.Router();
require('./routing/auth_routes')(authRouter, passport);
require('./routing/api_routes')(apiRouter, authenticator);
app.use('/auth', authRouter);
app.use('/api', apiRouter);

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


// Serve static files in public directory
app.use(express.static(__dirname + '/public'));

// Start listening for requests
var port = process.env.PORT || config.port;
app.listen(port, config.address, function () {
	console.log("Listening on port " + config.port);
});