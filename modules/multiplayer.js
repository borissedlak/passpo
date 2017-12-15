// --------- CUSTOM INCLUDES--------------->>
var config = require('../config/config.json');
var gamevariable = require('../config/gamevariable.json');
var Flag = require('../models/flag');
var util = require('../modules/util');

// --------- VARIABLES --------------->>
var spawnradius = gamevariable.spawnradius; //set spawnradius
var googleMapsClient = require('@google/maps').createClient({ //set google api key
    key: config.googlemaps_api_key
});

module.exports = {

    //get the multiplayer flags nearby
    getMPFlag: function (request, callback) {
        var googleResults = [];
        var randomValue;

        if (request.query.lat && request.query.lng) {
            //set Player Position
            playerPositionLat = request.query.lat;
            playerPositionLong = request.query.lng;

            Flag.find(function (err, result) {
                if (err) {
                    return callback(false, err);;
                }
                if (result) {
                    //existing entry
                    for (var i = 0; i < result.length; i++) {
                        if (util.getDistanceFromLatLngInM(playerPositionLat, playerPositionLong, result[i].pos.current.lat, result[i].pos.current.long) >= gamevariable.spawnradius) {  //check if in 2km
                            //TODO: mit mehreren Flaggen
                            return callback(true, result[i]);
                        }
                    }
                    //create new multiplayer flag in a 2 km radius
                    /*console.log(util.addDistanceToLatLng(48.213980, 15.631649, 2000, 2000));
                    console.log(util.getDistanceFromLatLngInM(48.213980, 15.631649, 48.23194630568239, 15.658611243083087));*/

                    googleMapsClient.placesNearby({
                        location: [request.query.lat, request.query.lng],
                        radius: spawnradius
                    }, function (err, response) {
                        if (!err) {
                            if (response.json.status == "OK") {   //found locations nearby 
                                //search db
                                console.log('location found nearby');

                                //console.log(response.json.results);
                                //save longitude and latitude in array
                                for (var i in response.json) {
                                    for (var j in response.json[i]) {
                                        if (response.json[i][j].geometry != undefined) {
                                            glocation = {
                                                'lat': response.json[i][j].geometry.location.lat,
                                                'lng': response.json[i][j].geometry.location.lng
                                            };
                                            googleResults.push(glocation);
                                        }
                                    }
                                }
                                
                                randomValue = Math.floor((Math.random() * (googleResults.length - 1)));
                                console.log(googleResults[randomValue]);

                                var flag = new Flag();
                                flag.owner = null;
                                flag.points = gamevariable.normalflag;
                                flag.pos = {
                                    "current": {
                                        "lat": googleResults[randomValue].lat,
                                        "long": googleResults[randomValue].lng
                                    },
                                    "destination": {
                                        //TODO
                                        "lat": 27,
                                        "long": 27
                                    },
                                    "origin": {
                                        "lat": googleResults[randomValue].lat,
                                        "long": googleResults[randomValue].lng
                                    }
                                };

                                flag.save(function (err) {
                                    if (err) {
                                        return callback(false, err);
                                    }
                                    return callback(true, flag);
                                });
                            }
                            else {   //no found locations nearby 
                                return callback(false, "no location found nearby");
                            }
                        }
                        else {
                            //error
                            return callback(false, "missing lat and/or long");
                        }
                    });
                }
            });
        }
        else {
            return callback(false, "missing lat and/or long");
        }
    }
    ,

    //pick up a multiplayer flag
    setFlag(lat, lng) {
        //TODO:
        /*Flag.update({ "points": 100 }, { "points": 101 }, function (err, res) {
            if (err) {
                return callback(false, err);
            }
            return callback(true, result);
        });*/
    }
}