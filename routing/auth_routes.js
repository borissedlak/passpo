module.exports = function (authRouter,passport) {
    //LOGIN
    //successful: redirect to main page, respond with status code 200
    //unsuccessful: stay on login site, display error message, respond with status code 401
    authRouter.post('/login', function (req, res) {
        passport.authenticate('local-login', function (err, user, info) {
            //console.log(err,user,info);
            res.status(info.status).json({ user: user, info: info });
            //Notice that when you pass parameters to a deeper function you have to include the reference at the end as below
        })(req, res);
    });

    //REGISTRATION
    //successful: redirect to login page, respond with status code 200
    //unsuccessful: stay on registration site, display error message, respond with status code 400|401
    authRouter.post('/signup', function (req, res) {
        passport.authenticate('local-signup', function (err, user, info) {
            //console.log(err,user,info);
            res.status(info.status).json({ user: user, info: info });
            //Notice that when you pass parameters to a deeper function you have to include the reference at the end as below
        })(req, res);
    });

    authRouter.get('/facebook', passport.authenticate('facebook'), function (req, res) { res.status(200) });

    authRouter.get('/facebook/callback', passport.authenticate('facebook',
        {
            successRedirect: '/profile',
            failureRedirect: '/'
        }
    ));
}