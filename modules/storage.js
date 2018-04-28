var User = require('../models/user');
var mongoose = require('mongoose');
var connectionString;

try{
	connectionString = 'mongodb://' + process.env.mongo_user + ':' + process.env.mongo_pass + '@' + process.env.mongo_host;
}
catch (e){
	console.log("Missing or invalid MongoDB environment variables \n" + e);
	process.exit();
}

module.exports = {
    connect: function () {
		mongoose.connect(connectionString)
	},
	connected: function () {
		return (mongoose.connection.readyState == 1);
	}
}