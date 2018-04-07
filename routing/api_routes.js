var User = require('../models/user');
var util = require('../modules/util')
var config = require('../config/config.json');
const status_codes = config.http_status_codes;

module.exports = function (apiRouter, authenticator) {

    apiRouter.get('/', function (req, res) {

        // IDEA: I get the Id from the debug_token function, so may I use it from there instead of the param
        // --> Every request is handles as if the user is in the db
    
        authenticator.isValidRequest(req, function (valid, msg) {
            if (valid) {
                return res.status(200).json({ data: msg });
            }
            else {
                return res.status(401).json({ error: msg });
            }
        });
    });
    
    apiRouter.get('/user', function (req, res) {
        authenticator.isValidRequest(req, function (valid, msg) {
            if (valid) {
                User.find(function (err, data) {
                    if (err) {
                        return res.status(500).json(error);
                    }
                    res.status(200).json(data);
                });
            }
            else {
                return res.status(401).json({ error: msg });
            }
        });
    });

}