var jwt = require('jwt-simple');
var util = require('../modules/util')
var config = require('../config/config.json');
const status_codes = config.http_status_codes;

module.exports = function (authRouter, passport) {

    //NOTE: If the login part that is duplicate in both functions I must encapsulate it as separate function

    //LOGIN
    //successful: redirect to main page, respond with status code 200
    //unsuccessful: stay on login site, display error message, respond with status code 401
    authRouter.post('/login', function (req, res) {
        if (util.isNullOrEmpty(req.body.username) || util.isNullOrEmpty(req.body.password)) {
            return res.status(status_codes.bad_request).json({ info: 'Login request must contain username and password in body' });
        }
        passport.authenticate('local-login', function (err, user, info) {
            if (user) {
                var payload = { user: user, strategy: 'local' };
                var token = jwt.encode(payload, process.env.jwt_secret);
                return res.status(info.status).json({ user: user, info: info.message, token: token });
            }
            else {
                return res.status(info.status).json({ info: info.message });
            }

        })(req, res);
    });

    //REGISTRATION
    //successful: redirect to login page, respond with status code 200
    //unsuccessful: stay on registration site, display error message, respond with status code 400|401
    authRouter.post('/signup', function (req, res) {
        if (util.isNullOrEmpty(req.body.username) || util.isNullOrEmpty(req.body.password)) {
            return res.status(status_codes.bad_request).json({ info: 'Signup request must contain username and password in body' });
        }
        passport.authenticate('local-signup', function (err, user, info) {
            if (err) {
                return res.status(info.status).json({ info: info.message });
            }
            if (user) {
                //How does the user object look like? Bette not include passwords here
                var payload = { user: user, strategy: 'local' };
                var token = jwt.encode(payload, process.env.jwt_secret);
                return res.status(info.status).json({ user: user, info: info.message, token: token });
            }
            else {
                return res.status(info.status).json({ info: info.message });
            }
            //Notice that when you pass parameters to a deeper function you have to include the reference at the end as below
        })(req, res);
    });

    authRouter.get('/facebook', passport.authenticate('facebook'));

    //If the passed credentials are invalid, the callback is never accessed!
    authRouter.get('/facebook/callback', function (req, res) {
        passport.authenticate('facebook', function (err, user, info) {
            console.log(err, user, info);
            if (user) {
                return res.status(info.status).json({ user: user, info: info.message, token: info.token });
            }
            else
                return res.status(info.status).json({ info: info.message });
        })(req, res)
    });
}