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
var authenticator = require('./modules/authenticator');
var storage = require('./modules/storage');
var User = require('./models/user');
var Flag = require('./models/flag');
var Item = require('./models/item');
var UserItem = require('./models/userItem');
var ItemFunctions = require('./modules/item');
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

app.get('/flag', function (req, res) {
	authenticator.isValidRequest(req, function (valid, msg) {
		if (valid) {
			Flag.find(function (err, data) {
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

app.post('/points', function (req, res) {
	authenticator.isValidRequest(req, function (valid, msg) {
		if (valid) {
			//console.log("Valid", req.headers.authorization, msg);
			return res.status(200).json({ message: 'Valid request' });
		}
		else {
			//console.log("Invalid", req.headers.authorization, msg);
			return res.status(401).json({ error: msg });
		}
	});
});

app.post('/flag', function (req, res) {
	authenticator.isValidRequest(req, function (valid, msg) {
		// #1 Make sure the post request contains a valid facebook token
		if (valid) {
			// #2 Make sure the POST contains a correct flag body
			if (!req.body.flag || req.body.flag == null) {
				return res.status(400).json({ error: "Flag Body missing" });
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

// Serve static files in public directory
app.use(express.static(__dirname + '/public'));

// Start listening for requests
app.listen(config.port, function () {
	console.log("Listening on port " + config.port);
});


//POST colleced Item to server
app.post('/itemPickup', function (req, res) {
	authenticator.isValidRequest(req, function (valid, msg) {
		// #1 Make sure the post request contains a valid facebook token
		if (valid) {
			// #2 Make sure the POST contains a correct flag body
			if (!req.body.userItem || req.body.userItem == null) {
				return res.status(400).json({ error: "userItem Body missing" });
			}

			var itemInputObject = req.body.userItem;
			var itemType = ItemFunctions.itemSwitchIn(itemInputObject.type);
			//var itemType = itemswitch(itemInputObject.type);			
			try {
				var userID = user._id;
			}
			catch (error) { }

			//Possible optimization reduce by using findoneandupdate
			UserItem.findOne({ "user": userID, "item": itemType }, function (err, result) {
				if (err) {
					return res.status(500).send(err);
				}
				if (result) {
					//existing entries amount plus one
					UserItem.update({ "user": userID, "item": itemType }, { $inc: { "amount": 1 } }, function (err, result) {
						if (err) {
							return res.status(500).send(err);
						}
						res.status(201).json({ message: 'Item updated in db' });
					});
				} else {
					//no existing entry and creating new UserItem entry
					var userItem = new UserItem();

					//set userItem attributes
					userItem.item = itemType;
					userItem.user = userID;
					userItem.amount = 1;

					userItem.save(function (err) {
						if (err) {
							return res.status(500).send(err);
						}

						res.status(201).json({ message: 'Item added to the db', data: userItem });
					});
				}
			});
		}
		else {
			return res.status(401).json({ error: msg });
		}
	});
});

//Get whole inventory (all items) for user
app.get('/inventory', function (req, res) {
	authenticator.isValidRequest(req, function (valid, msg) {
		try {
			var userID = user._id;
		}
		catch (error) { }

		if (valid) {
			UserItem.find({ "user": userID }, function (err, result) {
				if (err) {
					return res.status(500).send(err);
				}
				if (result) {
					//existing entry
					var ret = [];
					for (var i = 0; i < result.length; i++) {
						ret.push({ "item": ItemFunctions.itemSwitchOut(result[i].item[0]), "amount": result[i].amount });
					}

					res.status(201).json({ "inventory": ret });
				} else {
					//no existing entry
					console.log("not found");
				}
			});
		}
		else {
			return res.status(401).json({ error: msg });
		}
	});
});

//Get item with id for user
app.get('/item/:id', function (req, res) {
	var itemType = ItemFunctions.itemSwitchIn(req.params.id);

	authenticator.isValidRequest(req, function (valid, msg) {
		try {
			var userID = user._id;
		}
		catch (error) { }

		if (valid) {
			UserItem.findOne({ "user": userID, "item": itemType }, function (err, result) {
				if (err) {
					return res.status(500).send(err);
				}
				if (result) {
					//existing entry
					res.status(201).json({ "amount": result.amount });
				} else {
					//no existing entry
					console.log("not found");
				}
			});
		}
		else {
			return res.status(401).json({ error: msg });
		}
	});
});