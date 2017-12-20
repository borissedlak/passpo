// --------- CUSTOM INCLUDES--------------->>
var config = require('../config/config.json');
var gamevariable = require('../config/gamevariable.json');
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
                    return callback(false, err);;
                }
                if (result) {
                    //existing entries
                    for (var i = 0; i < result.length; i++) {
                        if (util.getDistanceFromLatLngInM(playerPositionLat, playerPositionLong, result[i].pos.current.lat, result[i].pos.current.long) <= gamevariable.spawnradius) {  //check if in 2km
                            flagResults.push(result[i]);
                        }
                    }
                    if (flagResults.length != 0) {
                        //return flag found in db
                        console.log("return flag found in db");
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
                                    destination = util.generateRandom(0, flagResults.length - 1, randomValue);

                                    //TODO: check if its not too close

                                    var flag = new Flag();
                                    flag.owner = null;
                                    flag.points = gamevariable.normalflag;
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

                                    flag.save(function (err) {
                                        if (err) {
                                            return callback(false, err);
                                        }
                                        return callback(true, flag);
                                    });
                                }
                                else {
                                    //no found locations nearby 
                                    return callback(false, "no location found nearby");
                                }
                            }
                            else {
                                //error
                                return callback(false, err);
                            }
                        });
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
    ,

    //pick up a multiplayer flag
    pickupFlag: function (req, userID, callback) {
        {
            if (!req.body.flagId == null) {
                return req.status(400).json({ error: "flagId Body missing" });
            }

            //TODO: error: userID is undefined
            try {
                var userID = user._id;
            }
            catch (error) { }

            Flag.update({ "_id": req.body.flagId  }, { "owner": userID }, function (err, result) {
                if (err) {
                    console.log("error update");
                    return callback(false, err);
                }
                return callback(true, 'Item updated in db');
            });
        }
    }
}