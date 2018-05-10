var User = require('../models/user');
var util = require('../modules/util')
var config = require('../config/config.json');
const status_codes = config.http_status_codes;
const error_messages = config.error_messages;

module.exports = function (apiRouter, authenticator) {

    apiRouter.get('/', function (req, res) {
        
        /**
         * The routing layer has to verify whether the incoming request contains all required components
         * In this case, an access token is requried before proceeding to the authentication step
         */
		if (util.isNullOrEmpty(req.headers.authorization)) {
			return res.status(400).json({ error: error_messages.token_missing });
		}

        authenticator.isValidRequest(req, function (valid, msg) {
            if (valid) {
                return res.status(200).json({ data: valid });
            }
            else {
                return res.status(401).json({ error: msg });
            }
        });
    });

    apiRouter.get('/user', function (req, res) {

		if (util.isNullOrEmpty(req.headers.authorization)) {
			return res.status(400).json({ error: error_messages.token_missing });
		}

        authenticator.isValidRequest(req, function (valid, msg) {
            if (valid) {
                User.find(function (err, data) {
                    if (err) {
                        return res.status(500).json(error);
                    }
                    return res.status(200).json(data);
                });
            }
            else {
                return res.status(401).json({ error: msg });
            }
        });
    });
}