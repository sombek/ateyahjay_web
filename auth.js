var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var express = require('express'); //express is framework on top of nodeJS
var app = express();  // initilize express

  var session = require('express-session');
  var bodyParser = require('body-parser');

  app.use(session({
    secret: "tHiSiSasEcRetStr",
    resave: true,
    saveUninitialized: true }));

  app.use(bodyParser.json()); 
  app.use(bodyParser.urlencoded({ extended: true }));  

  
  
  app.use(passport.initialize());
  app.use(passport.session());

  // hardcoded users, ideally the users should be stored in a database
  var users = [{"id":111, "username":"user", "password":"pass"}];

  // passport needs ability to serialize and unserialize users out of session
  passport.serializeUser(function (user, done) {
      done(null, users[0].id);
  });
  passport.deserializeUser(function (id, done) {
      done(null, users[0]);
  });

  // passport local strategy for local-login, local refers to this app
  passport.use('local-login', new LocalStrategy( //هنا الي قال عليه حق التصميم والباسس او اليوزر غلط
      function (username, password, done) {
          if (username === users[0].username && password === users[0].password) {
              return done(null, users[0]);
          }
        else if(username === users[0].username && password != users[0].password){
            console.log("Password is wroung.");
              return done(null, false);
        }else {
              console.log("User not found.");
              return done(null, false);
          }
      })
  );

  function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()){
      console.log('nexted');
      return next();
    }
    res.redirect('/login');
  }
  