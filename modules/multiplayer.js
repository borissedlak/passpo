// --------- CUSTOM INCLUDES--------------->>
var config = require('../config/config.json');
var gamevariable = require('../config/gamevariable.json');
var Flag = require('../models/flag');


// --------- VARIABLES --------------->>
var spawnradius = gamevariable.spawnradius; //set spawnradius
var googleMapsClient = require('@google/maps').createClient({ //set google api key
    key: config.googlemaps_api_key
});


getFlag(48.213980, 15.631649);
//getFlag(58.616232, -30.244014);

//get flag
// parameters:
//      playerLocation -> coordinate -> format: google.maps.LatLng(lat, lng)
function getFlag(lat, lng) {
    console.log("get Flag");
    //var latLng = new google.maps.LatLng("48.213980", "15.631649");
    googleMapsClient.placesNearby({
        location: [lat, lng],// [48.213980, 15.631649],
        radius: spawnradius,
        //type: 'restaurant'
    }, function (err, response) {
        if (!err) {
            if (response.json.status == "OK") {   //found locations nearby 
                //search db
                console.log('location found nearby');

                var arr = [];
                //console.log(response.json.results);
                //save longitude and latitude in array
                for (var i in response.json) {
                    for (var j in response.json[i]) {
                        if (response.json[i][j].geometry != undefined) {
                            glocation = {
                                'lat': response.json[i][j].geometry.location.lat,
                                'lng': response.json[i][j].geometry.location.lng
                            };
                            arr.push(glocation);
                        }
                    }
                }

                //get the boarders for the DB search
                var latMin, latMax, lngMin, lngMax;
                for (var i = 0; i < arr.length; i++) {
                    if(i == 0){
                        latMin = arr[i].lat;
                        latMax = arr[i].lat;
                        lngMin = arr[i].lng;
                        lngMax = arr[i].lng;
                        
                    }
                    else{
                        if(latMin >= arr[i].lat){
                            //console.log(latMin+">"+arr[i].lat);
                            latMin = arr[i].lat;
                        }
                        if(lngMin >= arr[i].lng){
                            //console.log(lngMin+">"+arr[i].lng);
                            lngMin = arr[i].lng;
                        }
                        if(lngMax <= arr[i].lng){
                            //console.log(lngMin+"<"+arr[i].lng);
                            lngMin = arr[i].lng;
                        }
                        if(latMax <= arr[i].lat){
                            //console.log(latMax+"<"+arr[i].lat);
                            latMax = arr[i].lat;
                        }

                    }
                    //console.log(arr[i].lat);
                    //console.log(arr[i].lng);
                }
                console.log("latMin: "+latMin);
                console.log("lngMin: "+lngMin);
                console.log("lngMax: "+lngMax);
                console.log("latMax: "+latMax);

                //var randomValue = Math.floor((Math.random() * (arr.length - 1)));
                //console.log(arr[randomValue]);

                //ObjectScan(response);


                /*Flag.findOne({ "pos": { "origin": { "lat": 123 } } }, function (err, result) {
                    console.log("test ");
                    if (err) {
                        console.log("error");
                        return res.status(500).send(err);
                    }
                    if (result) {
                        //existing entry
                        console.log("found");
                        res.status(201).json({ "test" :2 });
                    } else {
                        //no existing entry
                        console.log("not found");
                    }
                });*/
                console.log("aaa");
                Flag.find({}).exec(function (err, data) {
                    console.log("1");
                    if (err) {
                        return res.status(500).json(error);
                        console.log("2");
                    }
                    console.log("3");
                    res.status(200).json(data);
                });

            }
            else {   //no found locations nearby 
                console.log('no location found nearby');
            }

        }
        else {
            //error
            console.log('google maps api error');
        }
    });
}

//scans through all properties
function ObjectScan(obj) {
    var k;
    if (obj instanceof Object) {
        for (k in obj) {
            if (obj.hasOwnProperty(k)) {
                //recursive call to scan property
                console.log(k + ':');
                ObjectScan(obj[k]);
            }
        }
    } else {
        //not an Object so obj[k] here is a value
        console.log(obj);
    };

};


  /*# README
  
  ## Paradigms
  1. Always test the API and in case of errors those must always be sent back to the requestor, ideally with correct HTTP status code. See [Status Codes]("https://de.wikipedia.org/wiki/HTTP-Statuscode") for a list of all HTTP status codes.
  
  
  ## POST flag data
  When posting flag data it is important, besides the facebook token authentication, to use the correct flag data structure (see below). The owner represents the object id from the user db, therefore it must be present in the other collection, otherwise it will throw an error. 
  
  ```json
  {
      "flag": {
          "pos": {
              "origin":{
                  "lat": 123,
                  "long": 456
              },
              "destination":{
                  "lat": 123,
                  "long": 456
              },
              "current":{
                  "lat": 123,
                  "long": 456
              }
          },
          "owner":"59ef3b0052b4ff151fd896d8"
      }
  }
  */

/*module.exports = {
    getFlag(playerPosition) {
        
    }
    ,

    setFlag(lat, lng) {
        
    },
 
    //add a distance to a coordinate
    // parameters:
    //      lat, lng -> latitude and langitude -> format: number
    //      dx, dy -> the added distance (<2km) -> format: number
    // return:
    //      google.maps.LatLng(lat, lng)
    addDistanceToLatLng(lat, lng, dx, dy) {
        var R = 6378137; // Radius of the earth in m 
        var new_lat = lat + (dy / R) * (180 / Math.PI);
        var new_lng = lng + (dx / R) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);

        return new google.maps.LatLng(parseFloat(new_lat), parseFloat(new_lng));
    },

    //Get the distance between two Coordinates (longitude, latitude) in meter
    // parameters:
    //      lat1, lng1 -> 1st latitude and langitude -> format: number
    //      lat2, lng -> 2nd latitude and langitude -> format: number
    // return:
    //      number
    getDistanceFromLatLngInM(lat1, lng1, lat2, lng2) {
        var R = 6378137; // Radius of the earth in m 
        var dLat = this.deg2rad(lat2 - lat1);  // deg2rad below
        var dLon = this.deg2rad(lng1 - lng2);
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in m
        //console.log('distance: ' + d);
        return d;
    },
    //convert degree to radian
    deg2rad(deg) {
        return deg * (Math.PI / 180)
    },

    //convert radian to degree
    rad2deg(rad) {
        return rad * 180 / Math.PI;
    }
    
}*/