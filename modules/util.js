module.exports = {
    //add a distance to a coordinate
    // parameters:
    //      lat, lng -> latitude and langitude -> format: number
    //      dx, dy -> the added distance (<2km) -> format: number
    // return:
    //      lat, lng
    addDistanceToLatLng(lat, lng, dx, dy) {
        var R = 6378137; // Radius of the earth in m 
        var new_lat = lat + (dy / R) * (180 / Math.PI);
        var new_lng = lng + (dx / R) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);

        //return new google.maps.LatLng(parseFloat(new_lat), parseFloat(new_lng));
        return { "lat": parseFloat(new_lat), "lng": parseFloat(new_lng) };
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
    },

    //scans through all properties
    ObjectScan(obj) {
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
    },

    //generates a random number between min, max also excludes a number
    // return:
    //      number
    generateRandom(min, max, except) {
        var num = Math.floor(Math.random() * (max - min + 1)) + min;
        return (num === except) ? generateRandom(min, max, except) : num;
    }
}