var jwt = require('jwt-simple');
var config = require('../config/config.json');

module.exports = function (authRouter, passport) {

    //NOTE: If the login part that is duplicate in both functions I must encapsulate it as separate function

    //LOGIN
    //successful: redirect to main page, respond with status code 200
    //unsuccessful: stay on login site, display error message, respond with status code 401
    authRouter.post('/login', function (req, res) {
        passport.authenticate('local-login', function (err, user, info) {
            if (user) {
                req.login(user, function (err) {
                    if (err) { return res.status(500).json({ err: err }); }
                    else{
                        var payload = {id: req.user._id};
                        var token = jwt.encode(payload, config.jwt_secret);
                        return res.status(info.status).json({ user: user, info: info, token: token });
                    }
                });
            }
            else
                return res.status(info.status).json({ user: req.user, info: info });

        })(req, res);
    });

    //REGISTRATION
    //successful: redirect to login page, respond with status code 200
    //unsuccessful: stay on registration site, display error message, respond with status code 400|401
    authRouter.post('/signup', function (req, res) {
        passport.authenticate('local-signup', function (err, user, info) {
            if (user) {
                req.login(user, function (err) {
                    if (err) { return res.status(500).json({ err: err }); }
                    else{
                        var payload = { id: req.user._id };
                        var token = jwt.encode(payload, config.jwt_secret);
                        return res.status(info.status).json({ user: user, info: info, token: token });
                    }
                });
            }
            else
                return res.status(info.status).json({ user: req.user, info: info });
            //Notice that when you pass parameters to a deeper function you have to include the reference at the end as below
        })(req, res);
    });

    /*loginUser: function ( request, callback ) {
        request.login(user, function (err) {
            if (err) { return next(err); }
            return res.status(info.status).json({ user: req.user, info: info });
        });
    }*/

    authRouter.get('/facebook', passport.authenticate('facebook'));

    authRouter.get('/facebook/callback', function (req, res) {
        console.log("FB Callback");
        passport.authenticate('facebook', function (err, user, info) {
            console.log(info);
            if (user) {
                req.login(user, function (err) {
                    if (err) { return res.status(500).json({ err: err }); }
                    else{
                        console.log(user);
                        return res.status(info.status).json({ user: user, info: info });
                    }
                });
            }
            else
                return res.status(info.status).json({ user: req.user, info: info });
        })(req, res)
    });
}