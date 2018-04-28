// ------------- BASIC INCLUDES ------------->>
var express = require('express');
var app = express();
var https = require('https');
var http = require('http');

var bodyParser = require('body-parser');
var fs = require('fs');
var mongoose = require('mongoose');
var passport = require('passport');

// ------------------------------------------<<

// --------- CUSTOM INCLUDES--------------->>
require('dotenv').config();
var authenticator = require('./modules/authenticator');
var storage = require('./modules/storage');
var util = require('./modules/util');
var config = require('./config/config.json');
require('./modules/passport')(passport); // pass passport for configuration
// ----------------------------------------<<


// ------ EXTENDED INCLUDES / SETUP ------->>

var privateKey = fs.readFileSync('./config/key.pem');
var certificate = fs.readFileSync('./config/server.crt');
var httpsOptions = { key: privateKey, cert: certificate };

//Allows JSON cookie parsing functionality
app.use(require('cookie-parser')());
storage.connect();
//mongoose.connect(configDB.url); // connect to our database
app.use(require('express-session')({ secret: 'my derest secret', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
// var cors = require('cors')
// app.use(cors());
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
// ----------------------------------------<<


// Serve static files in public directory
app.use(express.static(__dirname + '/public'));

// Start listening for requests
// var port = process.env.PORT || config.port;
// app.listen(port, config.address, function () {
// 	console.log("Listening on port " + config.port);
// });

// ------------ SECUTIY INCLUDES ------------>>

//HTTPS forcing
var httpServer = http.createServer(app);
var httpsServer = https.createServer(httpsOptions, app);


// httpServer.listen(8080, config.address, function(){
// 	console.log("Listening on port " + 8080);
// });
httpsServer.listen(8443, config.address, function(){
	console.log("Listening on port " + 8443);
});


// httpServer.all('*', function (req, res) {
// 	return res.send(400).json({ error: "HTTP is not supported, use HTTPS instead" });
// });
// ----------------------------------------<<
