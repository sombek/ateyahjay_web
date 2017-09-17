  // server requirments 
  var express = require('express'); //express is framework on top of nodeJS
  var app = express();  // initilize express

  var genId = require('gen-id')('nnn'); // random id generator


  var nodemailer = require('nodemailer'); // Nodemailer for sending emails for the users
  var transporter = nodemailer.createTransport({ // Nodemailer initiliztion
    service: 'gmail',
    auth: { //Your Email info
      user: 'abdullah97hashim@gmail.com', 
      pass: '231324aa'
    }
  });

  var session = require('express-session');
  var bodyParser = require('body-parser');
  var moment = require('moment');

  app.use(session({
    secret: "tHiSiSasEcRetStr",
    resave: true,
    saveUninitialized: true }));

  app.use(bodyParser.json()); 
  app.use(bodyParser.urlencoded({ extended: true }));  

  var passport = require('passport');
  var LocalStrategy = require('passport-local').Strategy;
  
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
            response="pass";
            return done(null, false);
        }else {
            response="user";
              return done(null, false);
          }
      })
  );

  app.get('/loginRes', (req,res,next)=>{
    res.json(response); 
    response="";
  });
  
  
  var response = "";

          
  function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()){
      return next();
    }
    res.redirect('/login');
  }
  
  //mongoDB requirments
  var mongo = require('mongodb').MongoClient; 
  var assert = require('assert'); // system requirment to check errors
  var url = 'mongodb://admin:admin@ds133281.mlab.com:33281/sombek'; //mongoDB information from 'mlab.com'

  //Templateing setup
  var handlebars = require('express-handlebars');
  app.engine('handlebars', handlebars({defaultLayout: 'main'}));
  app.set('view engine','handlebars');

  // To acceses the p file (for images)
  app.use(express.static(__dirname+'/public')); //to give the website the ability to visit public foldse
  // like this localhost:3000/public/css/stylesheets.css
  app.use(require('body-parser').urlencoded({extended:true})); // i don't know why I added this 


  // If the localhost:3000/(junk)
  app.get('/junk',(req,res,next)=>{
      console.log('Tried to access /junk');
      throw new Error('/junk doesn\'t exist');
  });

  app.use((err,req,res,next)=>{
      console.log('Error: '+err.message);
      next(); //beacuse of next will go to the 404 or 500 
              // will skip /about because it doesn't match the url
  });


  app.post('/process',(req,res)=>{
    // This is just to print the inputed data
    var id = genId.generate();
    //check if the id is dublicated, then regenerate another one
    console.log('Status: ','Pending');
    console.log('Name : ',req.body.name);
    console.log('Email : ',req.body.email);
    console.log('Phone : ',req.body.phone);
    console.log('Order Type: ',JSON.stringify(req.body.orderType));
    console.log('Order ID: ',id);
    
    // To initilize the data added by the user
    // NOTE: order is already declared below, so all other functions can use it
    order =   { "Status":'Pending',
                "Name":req.body.name,
                "Email":req.body.email,
                "Phone":req.body.phone,
                "Order Type": req.body.orderType,
                "Desc":req.body.desc,
                "id":id,
                "time":moment().format()
              };
    
    //database connection 
    mongo.connect(url,(err,db)=>{
      assert.equal(null,err); // to check if error is occured 

      // database insertion function 
      db.collection('new').insertOne(order,(err,result)=>{
        assert.equal(null,err); // to check if error is occured 
        console.log(JSON.stringify(order) + ' is inserted');
        db.close();
      }); 
    }); //end of mongo connect 

    // nodemailer properties 
    var mailOptions = {
      from: 'abdullah97hashim@gmail.com',
      to: order.Email,
      subject: 'Automated Message using nodeJS',
      text: 'Thank you for your request ' + order.Name + '\nYour Mobile is: '+ order.Phone + ' Your order Type is ' + order["Order Type"]
    };

    transporter.sendMail(mailOptions, function(error, info){
      if (error) { console.log(error); } // checking errors NOTE: we can use assertion instead of if statments
      else {console.log('Email sent: ' + info.response);}
    });
      // after finishing the post function redirect the {{{body}}} to thankyou.handlebars
      res.redirect('thankyou');
  }); //end of post function

  app.get('/thankyou',(req,res)=>{ // routing the /thankyou to render the thankyou.handlebars page
      res.render('thankyou');
  });

  app.get('/login', (req,res)=>{ 
    //res.render('login');
      res.sendFile(path.join(__dirname+'/views/login.html'));
  });

  /*app.post('/login',(req, res, next)=> {

		// you might like to do a database look-up or something more scalable here
		if (req.body.username && req.body.username === 'user' && req.body.password && req.body.password === 'pass') {
			req.session.authenticated = true;
			res.redirect('/admin');
		} else {
          console.log('not correct')
			res.redirect('/login');
		}

	});*/
  
  app.post("/login", 
      passport.authenticate('local-login', {failureRedirect: "/login"}),
      (req,res)=>{ 
        res.redirect('/admin');
        console.log('finished logining'); 
      }
  );

  app.get('/tables_dynamic', (req,res)=>{ 
    res.sendFile(path.join(__dirname+'/views/tables_dynamic.html'));
  //  res.render('tables_dynamic');
  });

  app.get('/admin',isLoggedIn, function (req, res) {
      console.log(req.isAuthenticated());
      res.sendFile(path.join(__dirname+'/views/tables_dynamic.html'));  
    //res.render('tables_dynamic');  
	});

  app.get('/logout', function (req, res, next) {
        req.logout();
		res.redirect('/login');
  });
  
  app.get('/get-data', (req,res,next)=>{
        var resultArray = [];
      mongo.connect(url,(err,db)=>{
        assert.equal(null,err);
        console.log('connected');
      
        var cursor = db.collection('new').find();
          cursor.forEach((doc,err)=>{       assert.equal(null,err);
          resultArray.push(doc);          
          },()=>{
              db.close();
              var orders = { data: [] };
            for(var i in resultArray) {    

                var item = resultArray[i];   
                if(item.id === undefined)
                  item.id = '000';
                if(item.Status === undefined)
                  item.id = 'Pending';
                if(item.time === undefined)
                  item.time = 'not-found'
              
                orders.data.push({ 
                    "Status" : item.Status,
                    "Name" : item.Name,
                    "Email"  : item.Email,
                    "Phone": item.Phone,
                    "OrderType" : item['Order Type'],
                    "Desc": item.Desc,
                    "id": item.id,
                    "time":item.time
                });
            };
        
              res.contentType('application/json');
              res.send((orders));
          });
        
      })
    });

  

  app.get('/counter', function (req, res) { //this is for ajax purposes 
      res.json(n-1);
      console.log('counter sent succesfully', n);
  });
  
  
var path = require('path');


  // Routing
  app.get('/',(req,res)=>{ 
    res.render('form');
  });


  app.get('/jsonFile', function (req, res, next) { //this is for ajax purposes 
      res.json(order); // This is why I declared the order globaly 
      console.log('JSON file sent succesfully');
    });



  var order; //Global varible to pass it 
  var n=0;
  var resArr = [];
  
  // Should be at the end
  // to get the error 404 page while input a wroung url
  app.use((req,res)=>{
    res.type('text/html');
    res.status(404);
    res.send('erorr 404 page is not found');
  });
  
  
  /*
  // do something with the session
  app.use(count);

  // custom middleware
  function count(req, res,next) { //visitor counter
    req.session.count = req.session.count || 0;
    n = req.session.count++;
    console.log('viewed ' + n + ' times\n');
    
    next();
  }
*/

  //Port Setup
  app.listen(process.env.PORT || 3000);
  // 'process.env.PORT' for heroku deployment purposes 
