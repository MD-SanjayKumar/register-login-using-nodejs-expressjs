const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth2').Strategy;

const OAuthClientID = '859399803362-rinjbs4mpg5rn9c20n4qjhoghg8h7qu5.apps.googleusercontent.com';
const OAuthClientSecret = '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';

passport.use(new GoogleStrategy({
    clientID: OAuthClientID,
    clientSecret: OAuthClientSecret,
    callbackURL: "http://localhost:6060/google/callback",
    passReqToCallback: true
},
    function (request, accessToken, refreshToken, profile, done) {
        return done(null, profile);
    }
));

passport.serializeUser(function (user, done) {
    done(null, user);
})

passport.deserializeUser(function (user, done) {
    done(null, user);
})