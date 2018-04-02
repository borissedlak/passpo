var User = require('../models/user');
var mongoose = require('mongoose');
var connectionString;

/*if(process.env.APP_CONFIG != null){
	var config = JSON.parse(process.env.APP_CONFIG);
	var mongoPassword = 'HcAftPbye2';
	connectionString = "mongodb://" + config.mongo.user + ":" + encodeURIComponent(mongoPassword) + "@" + config.mongo.hostString;
}
else{*/
	connectionString = 'mongodb://Hajibaba:abcd1234@ds036178.mlab.com:36178/passpo';
//}

module.exports = {
    connect: function () {
		mongoose.connect(connectionString)
	},
	connected: function () {
		return (mongoose.connection.readyState == 1);
	}
}