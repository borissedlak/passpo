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
var path = require('path');

// ----------------------------------------<<


// --------- CUSTOM INCLUDES--------------->>
var authenticator = require('./modules/authenticator');
var storage = require('./modules/storage');
var User = require('./models/user');
var Flag = require('./models/flag');
var Item = require('./models/item');
var UserItem = require('./models/userItem');
var ItemFunctions = require('./modules/item_func');
var util = require('./modules/util');
var multiplayer = require('./modules/multiplayer');
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
			if (req.body.amount == null) {
				return res.status(400).json({ error: "Missing req.body.amount parameter" });
			}
			else {
				var amount = req.body.amount;
			}
			var user = valid;

			User.update({ _id: valid._id }, { $inc: { "global.score": amount } }, function (err, result) {
				if (err) {
					return res.status(500).send(err);
				}
				return res.status(201).json({ message: 'Added ' + amount + ' points to ' + user.global.username });
			});
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
var port = process.env.PORT || config.port;
app.listen(port, config.address, function () {
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

			var userID = valid._id;

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
		if (valid) {

			userID = valid._id;

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

					res.status(200).json({ "inventory": ret });
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
		if (valid) {
			var userID = valid._id;

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


app.post('/upload', function (req, res) {
	authenticator.isValidRequest(req, function (valid, msg) {
		if (valid) {
			console.log(req.files);
			if (!req.files.profilePicture) {
				return res.status(400).send('Image file missing!');
			} else {
				let imageFile = req.files.profilePicture;
				let pictureID = valid._id;

				/*require("fs").writeFile(`./profile_pictures/${pictureID}.jpg`, req.files.profilePicture.data, 'base64', function(err) {
					if (err){
						console.log("couldn't move file", err);
						return res.status(500).send(err);
					} else {
						console.log("moved file");
						return res.status(201).send('Uploaded successfully');
					}
				});*/

				imageFile.mv(`./profilePictures/${pictureID}.jpg`, function (err) {
					if (err) {
						console.log("couldn't move file", err);
						return res.status(500).send(err);

					} else {
						console.log("moved file");
						return res.status(201).send('Uploaded successfully');
					}
				});
			}
		}
	});
});

app.get('/profilePicture/:userid', function (req, res) {
	//For reasons of simplicity the authentication for the profilePictures has been removed
	//If it turns out that they should be protected, we need to secure them again
	var userid = req.params.userid;
	return res.sendFile(path.join(__dirname, './profilePictures', `${userid}.jpg`));

	/*authenticator.isValidRequest(req, function (valid, msg) {
		if (valid) {

			var imageFile = (path.join(__dirname, './profile_pictures', `${userid}.jpg`));
			var img = new Buffer(imageFile, 'base64');

			res.writeHead(200, {
				'Content-Type': 'image/jpg',
				'Content-Length': img.length
			});

			res.end(img);


			//res.sendFile(path.join(__dirname, './profile_pictures', `${userid}.jpg`))
		} else {
			return res.status(401).json({ error: msg });
		}
	})*/
})

//Get list of best x users
app.get('/leaderboard', function (req, res) {
	//If the client doesnt specify a number of users, the default is 30 			
	var numberUsers = (req.query.numberUsers) ? req.query.numberUsers : 30;
	//make sure the request from the user is authenticated
	authenticator.isValidRequest(req, function (valid, msg) {
		if (valid) {
			//query parameter from client needs to be casted
			User.find({}).sort({ 'global.score': -1 }).limit(Number(numberUsers)).select({ _id: 1, 'global.username': 1, 'global.score': 1 }).exec(function (err, result) {
				if (err) {
					return res.status(500).send(err);
				}
				//existing entry
				return res.status(201).json({ "leaderboard": result });
			});
		}
		else {
			return res.status(401).json({ error: msg });
		}
	});
});

//Get multiplayer flag
app.get('/getMPFlag', function (req, res) {
	authenticator.isValidRequest(req, function (valid, msg) {
		if (valid) {
			multiplayer.getMPFlag(req, function (success, results) {
				if (success) {
					return res.status(200).json({ data: results });
				}
				else {
					return res.status(500).json({ error: results });
				}
			});
		}
		else {
			return res.status(401).json({ error: msg });
		}
	});
});

//pickup multiplayer flag -> sets owner for the flag
app.post('/pickupMPFlag', function (req, res) {
	authenticator.isValidRequest(req, function (valid, msg) {
		if (valid) {
			if (!req.body.flagId == null) {
				return req.status(400).json({ error: "flagId Body missing" });
			}
			else {
				var userID = valid._id;
				var flagId = req.body.flagId;
				multiplayer.pickupFlag(req, userID, flagId, function (valid2, msg2) {
					if (valid2) {
						return res.status(200).json({ data: msg2 });
					}
					else {
						return res.status(500).json({ error: msg2 });
					}
				});
			}
		}
		else {
			return res.status(401).json({ error: msg });
		}
	});
});

//pickup multiplayer flag -> sets owner for the flag
app.post('/dropMPFlag', function (req, res) {
	authenticator.isValidRequest(req, function (valid, msg) {
		if (valid) {
			if (!req.body.flagId == null) {
				return req.status(400).json({ error: "flagId Body missing" });
			}
			else {
				var userID = valid._id;
				multiplayer.dropFlag(req, userID, function (valid2, msg2) {
					if (valid2) {
						return res.status(200).json({ data: msg2 });
					}
					else {
						return res.status(500).json({ error: msg2 });
					}
				});
			}
		}
		else {
			return res.status(401).json({ error: msg });
		}
	});
});

//set the flag to user current position
app.post('/setCurrentMPFlagPosition', function (req, res) {
	authenticator.isValidRequest(req, function (valid, msg) {
		if (valid) {
			if ((!req.body.playerPositionLat == null) || (!req.body.playerPositionLong == null)) {
				return req.status(400).json({ error: "playerPosition Body missing" });
			}
			else {
				var userID = valid._id;
				var playerPositionLat = req.body.playerPositionLat;
				var playerPositionLong = req.body.playerPositionLong;
				multiplayer.setCurrentMPFlagPosition(req, userID, playerPositionLat, playerPositionLong, function (valid2, msg2) {
					if (valid2) {
						return res.status(200).json({ data: msg2 });
					}
					else {
						return res.status(500).json({ error: msg2 });
					}
				});
			}
		}
		else {
			return res.status(401).json({ error: msg });
		}
	});
});

//get multiplayer flag
app.get('/getMPFlagId', function (req, res) {
	authenticator.isValidRequest(req, function (valid, msg) {
		if (valid) {
			var userID = valid._id;
			multiplayer.getPlayerFlag(req, userID, function (success, results) {
				if (success) {
					return res.status(200).json({ data: results });
				}
				else {
					return res.status(500).json({ error: results });
				}
			});
		}
		else {
			return res.status(401).json({ error: msg });
		}
	});
});