var User = require('../models/user');
var mongoose = require('mongoose');
var connectionString;

if(process.env.APP_CONFIG != null){
	var config = JSON.parse(process.env.APP_CONFIG);
	var mongoPassword = 'SuperSecure55#!';
	connectionString = "mongodb://" + config.mongo.user + ":" + encodeURIComponent(mongoPassword) + "@" + config.mongo.hostString;
}
else{
	connectionString = 'mongodb://Basta55:HcAftPbye2@ds121575.mlab.com:21575/api';
}

module.exports = {
	// Do I need the connection anyhow?
    connect: function () {
		mongoose.connect(connectionString)
	},
	connected: function () {
		return (mongoose.connection.readyState == 1);
	}
}