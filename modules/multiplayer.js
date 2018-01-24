// --------- CUSTOM INCLUDES--------------->>
var config = require('../config/config.json');
var gamevariable = require('../config/gamevariable.json');
var ItemFunctions = require('../modules/item_func');
var UserItem = require('../models/userItem');
var Flag = require('../models/flag');
var User = require('../models/user');
var util = require('../modules/util');

// --------- VARIABLES --------------->>
var spawnradius = gamevariable.spawnradius; //set spawnradius
var googleMapsClient = require('@google/maps').createClient({ //set google api key
    key: config.googlemaps_api_key
});

module.exports = {
    //get the multiplayer flags nearby
    getMPFlag: function (request, callback) {
        var flagResults = [];
        var randomValue;

        if (request.query.lat && request.query.lng) {
            //set Player Position
            playerPositionLat = request.query.lat;
            playerPositionLong = request.query.lng;

            //get flag in db
            Flag.find(function (err, result) {
                if (err) {
                    return callback(false, err);
                }
                //Is true for an empty result set, false only on server error eg
                if (result) {
                    for (var i = 0; i < result.length; i++) {
                        if (util.getDistanceFromLatLngInM(playerPositionLat, playerPositionLong, result[i].pos.current.lat, result[i].pos.current.long) <= gamevariable.spawnradius) {  //check if in 2km
                            flagResults.push(result[i]);
                        }
                    }
                    spawnFlags();
                    function spawnFlags() {
                        if (flagResults.length >= 3) {
                            //return flag found in db
                            //console.log(flagResults.length + "flag from db");
                            return callback(true, flagResults);
                        }
                        else {
                            console.log("not found in db -> google search");
                            //if not found in db create a new one with google placesNearby function
                            googleMapsClient.placesNearby({
                                location: [request.query.lat, request.query.lng],
                                radius: spawnradius
                                //TODO: type ?
                            }, function (err, response) {
                                if (!err) {
                                    if (response.json.status == "OK") {   //found locations nearby 
                                        //save longitude and latitude in array
                                        for (var i in response.json) {
                                            for (var j in response.json[i]) {
                                                if (response.json[i][j].geometry != undefined) {
                                                    glocation = {
                                                        'lat': response.json[i][j].geometry.location.lat,
                                                        'lng': response.json[i][j].geometry.location.lng
                                                    };
                                                    flagResults.push(glocation);
                                                }
                                            }
                                        }

                                        randomValue = Math.floor((Math.random() * (flagResults.length - 1)));
                                        var randomDestination;
                                        var destination;
                                        var loops = true;
                                        var i = 0;
                                        while (loops || (i < gamevariable.maxloops)) {
                                            i++;
                                            destination = util.generateRandom(0, flagResults.length - 1, randomValue);
                                            // check if its not too close
                                            if (util.getDistanceFromLatLngInM(flagResults[randomValue].lat, flagResults[randomValue].lng, flagResults[destination].lat, flagResults[destination].lng) < gamevariable.spawnradius + 1) {
                                                // found right destination, end search
                                                loops = false;
                                            }
                                        }

                                        //create random destination if no right location is found
                                        if (i == loops) {
                                            randomDestination = util.addDistanceToLatLng(flagResults[randomValue].lat, flagResults[randomValue].lng, Math.floor((Math.random() * gamevariable.spawnradius)), Math.floor((Math.random() * gamevariable.spawnradius)));
                                            flagResults[destination].lat = randomDestination.lat;
                                            flagResults[destination].lng = randomDestination.lng;
                                        }

                                        var flag = new Flag();
                                        flag.owner = null;
                                        flag.points = gamevariable.normalMPFlag;
                                        flag.pos = {
                                            "current": {
                                                "lat": flagResults[randomValue].lat,
                                                "long": flagResults[randomValue].lng
                                            },
                                            "destination": {
                                                "lat": flagResults[destination].lat,
                                                "long": flagResults[destination].lng
                                            },
                                            "origin": {
                                                "lat": flagResults[randomValue].lat,
                                                "long": flagResults[randomValue].lng
                                            }
                                        };
                                        flag.hidden = null;

                                        flag.save(function (err) {
                                            if (err) {
                                                return callback(false, err);
                                            }
                                            flagResults.push(flag);
                                            spawnFlags();
                                        });
                                    }
                                    else if (response.json.status == "ZERO_RESULTS") {
                                        //no found locations nearby 
                                        //create random location
                                        var randomLocation = util.addDistanceToLatLng(playerPositionLat, playerPositionLong, Math.floor((Math.random() * gamevariable.spawnradius) + gamevariable.activeDistance), Math.floor((Math.random() * gamevariable.spawnradius) + gamevariable.activeDistance));

                                        //create random destination
                                        var randomDestination = util.addDistanceToLatLng(randomLocation.lat, randomLocation.lng, Math.floor((Math.random() * gamevariable.spawnradius) + gamevariable.activeDistance), Math.floor((Math.random() * gamevariable.spawnradius) + gamevariable.activeDistance));;

                                        var flag = new Flag();
                                        flag.owner = null;
                                        flag.points = gamevariable.normalMPFlag;
                                        flag.pos = {
                                            "current": {
                                                "lat": randomLocation.lat,
                                                "long": randomLocation.lng
                                            },
                                            "destination": {
                                                "lat": randomDestination.lat,
                                                "long": randomDestination.lng
                                            },
                                            "origin": {
                                                "lat": randomLocation.lat,
                                                "long": randomLocation.lng
                                            }
                                        };


                                        flag.save(function (err) {
                                            if (err) {
                                                return callback(false, err);
                                            }
                                            flagResults.push(flag);
                                            //Recursion goes until there are at least 3 flags around
                                            spawnFlags();
                                        });
                                    }
                                    else {
                                        return callback(false, "response status not included");
                                    }
                                }
                                else {
                                    //error
                                    return callback(false, err);
                                }
                            });
                        }
                    }
                }
                else {
                    return callback(false, "no results in db");
                }
            });
        }
        else {
            return callback(false, "missing lat and/or long");
        }
    }

    //pick up a multiplayer flag
    , pickupFlag: function (req, userID, flagId, callback) {
        {
            Flag.updateOne({ "_id": flagId }, { "owner": userID }, function (err, result) {
                if (err) {
                    return callback(false, err);
                }
                return callback(true, 'flag pickup');
            });
        }
    }

    //drop a multiplayer flag
    , dropFlag: function (req, userID, callback) {
        {
            Flag.findOne({ "owner": userID }, function (err, result) {
                if (err) {
                    return callback(false, err);
                }
                if (result) {
                    Flag.update({ "_id": result._id }, { "owner": null }, function (err, result) {
                        if (err) {
                            return callback(false, err);
                        }
                        return callback(true, 'flag drop');
                    });
                }
                else {
                    return callback(false, "not found");
                }
            });
        }
    }

    //set current position for multiplayer flag
    , setCurrentMPFlagPosition: function (req, userID, playerPositionLat, playerPositionLong, callback) {
        {
            Flag.findOne({ "owner": userID }, function (err, result) {
                if (err) {
                    return callback(false, err);
                }
                if (result) {
                    Flag.update({ "owner": userID }, { "pos.current.lat": playerPositionLat, "pos.current.long": playerPositionLong }, function (err, result) {
                        if (err) {
                            return callback(false, err);
                        }
                        return callback(true, 'set current MPFlagPosition');
                    });
                }
                else {
                    return callback(false, "not found");
                }
            });
        }
    }

    //get flag with owner = player
    , getPlayerFlag: function (req, userID, callback) {
        {
            Flag.findOne({ "owner": userID }, function (err, result) {
                if (err) {
                    return callback(false, err);
                }
                return callback(true, result);
            });
        }
    }

    //activate the item magic hood (sets hidden attribut to now (timestamp))
    , activateItemHood: function (req, userID, callback) {
        {
            //find player flag
            Flag.findOne({ "owner": userID }, function (err, result) {
                if (err) {
                    return callback(false, err);
                }
                else {
                    if (result) {
                        if (!result.hidden || result.hidden == null) {
                            console.log("activate item hood");
                            Flag.update({ "owner": userID }, { "hidden": Date.now() }, function (err, result) {
                                if (err) {
                                    return callback(false, err);
                                }
                                return callback(true, 'hidden');
                            });
                        }
                        else {
                            return callback(false, 'is already activated');
                        }
                    }
                }
            });
        }
    }

    //reduze hood item by one
    , decrementItemHood: function (req, userID, callback) {
        var itemType = ItemFunctions.itemSwitchIn(String(gamevariable.itemHood));
        UserItem.update({ "user": userID, "item": itemType }, { $inc: { "amount": -1 } }, function (err, result) {
            if (err) {
                return callback(false, err);
            }
            return callback(true, 'reduce hood item by one');
        });
    }

    //reduze Magnet item by one
    , decrementItemMagnet: function (req, userID, callback) {
        var itemType = ItemFunctions.itemSwitchIn(String(gamevariable.itemMagnet));
        UserItem.update({ "user": userID, "item": itemType }, { $inc: { "amount": -1 } }, function (err, result) {
            if (err) {
                return callback(false, err);
            }
            return callback(true, 'reduce magnet item by one');
        });
    }

    //check the hidden attribut and see in which it is state
    , itemHoodActivation: function (req, userID, callback) {
        {
            //find player flag
            Flag.findOne({ "owner": userID }, function (err, result) {
                if (err) {
                    return callback(false, err);
                }
                else {
                    if (result) {
                        if (!result.hidden || result.hidden == null) {
                            return callback(true, "not activated");
                        }
                        else {
                            //check if 30 sec
                            var firstTime = Date.parse(result.hidden);
                            var active = new Date(firstTime + gamevariable.hoodActive);
                            var cooldown = new Date(firstTime + gamevariable.hoodCooldown);
                            if (Date.now() < active) {
                                //the user is for 15 sec hidden from other players
                                return callback(true, "hidden");
                            }
                            else if (Date.now() < cooldown) {
                                //after 15 sec the user can not use the magic hood again
                                return callback(true, "cooldown");
                            }
                            else {
                                //after 30 sec the user can use the magic hood again
                                Flag.update({ "owner": userID }, { "hidden": null }, function (err, result) {
                                    if (err) {
                                        return callback(false, err);
                                    }
                                    return callback(true, 'set hidden to ');
                                });
                            }
                        }
                    }
                    else {
                        return callback(true, "no flag found");
                    }
                }
            });
        }
    }
}