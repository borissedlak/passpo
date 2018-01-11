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
                    return callback(false, err);
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
                            console.log("aaa" + response.json.status);
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

                                    flag.save(function (err) {
                                        if (err) {
                                            return callback(false, err);
                                        }
                                        var result = []
                                        result.push(flag);
                                        return callback(true, result);
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
                                        var result = []
                                        result.push(flag);
                                        return callback(true, result);
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
                    console.log(result);
                    Flag.update({ "_id": result._id }, { "owner": null }, function (err, result) {
                        if (err) {
                            return callback(false, err);
                        }
                        return callback(true, 'flag drop');
                    });
                }
            });
        }
    }
}