var express = require("express"), 
    mongoose = require("mongoose"), 
    passport = require("passport"), 
    axios = require("axios"),
    cors = require('cors'),
	nodemailer = require('nodemailer'),
	schedule = require('node-schedule'),
    bodyParser = require("body-parser"), 
    LocalStrategy = require("passport-local"), 
    User = require("./user");
  
mongoose.set('useNewUrlParser', true); 
mongoose.set('useFindAndModify', false); 
mongoose.set('useCreateIndex', true); 
mongoose.set('useUnifiedTopology', true); 
mongoose.connect("mongodb://localhost/auth_demo_app"); 
var app = express(); 
app.use(express.static('public'))
app.set("view engine", "ejs"); 
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true })); 
  
app.use(require("express-session")({ 
  secret: "Rusty is a dog", 
  resave: false, 
  saveUninitialized: false
})); 

app.use(passport.initialize()); 
app.use(passport.session()); 
app.use(express.json());
app.use(express.urlencoded({extended : true}));
  
passport.use(new LocalStrategy(User.authenticate())); 
passport.serializeUser(User.serializeUser()); 
passport.deserializeUser(User.deserializeUser()); 
  
app.get("/", function (req, res) { 
  res.render("login"); 
}); 
  
// Showing  page 
app.get("/main", isLoggedIn, function (req, res) { 
  res.render("main"); 
}); 

// Showing register form 
app.get("/register", function (req, res) { 
  res.render("register"); 
}); 

//Showing review page
app.get("/review", isLoggedIn, function (req, res) { 
  res.render("review"); 
}); 

//Showing reminder page
app.get("/reminder", isLoggedIn, function (req, res) {
	res.render("reminder");
});

// Handling user signup 
app.post("/register", function (req, res) { 
  var username = req.body.username 
  var password = req.body.password 
  var email = req.body.email
  User.register(new User({ username: username, email:email, state:{},reminders:{}}), 
          password, function (err, user) { 
      if (err) { 
          console.log(err); 
          return res.render("register"); 
      } 

      passport.authenticate("local")( 
          req, res, function () { 
          res.render("main"); 
      }); 
  }); 
}); 


//Handling user login 
app.post("/", passport.authenticate("local", { 
  successRedirect: "/main", 
  failureRedirect: "/"
}), function (req, res) { 
}); 

//Handling user logout  
app.get("/logout", function (req, res) { 
  req.logout(); 
  res.redirect("/"); 
}); 

//Setting reminder
app.post("/remind", isLoggedIn, function (req,res) {
	var id = req.user.id;
	User.findByIdAndUpdate(id, {reminders : req.body.reminders} , 
	function (err, docs) { 
		if (err){ 
		  console.log(err) 
		} else{
			let mailOptions = {
				from: 'lifeplanner101.node@gmail.com',
				to: docs.email,
				subject: 'Reminder for ' + req.body.reminders[req.body.reminders.length-1].Event + '!',
				text : 'This is a reminder for ' + req.body.reminders[req.body.reminders.length-1].Event + ' scheduled on ' + req.body.reminders[req.body.reminders.length-1].date + '.'
			};
			let transporter = nodemailer.createTransport({
				service: 'gmail',
				auth: {
					user: 'lifeplanner101.node@gmail.com',
					pass: 'LP1234567'
				}
			});
			var send = schedule.scheduleJob(req.body.reminders[req.body.reminders.length-1].date,function(){
				transporter.sendMail(mailOptions, function(error, info){
				if (error){
					console.log(error);
				} else{
					console.log('Email sent: ' + info.response);
				}
				});
			});
			res.send();
		}
  });
});

app.get("/getremind", isLoggedIn, function (req, res) { 
  var id = req.user.id;
  User.findOne({_id: id}, function (err, user) {
    if (err) return res.json(400, {message: `user ${id} not found.`});
    res.json(user);
  });
}); 


app.get("/load", isLoggedIn, function (req, res) { 
  var id = req.user.id;
  User.findOne({_id: id}, function (err, user) {
    if (err) return res.json(400, {message: `user ${id} not found.`});
    // make sure you omit sensitive user information 
    // on this object before sending it to the client.
    res.json(user);
  });
}); 

app.post("/save", isLoggedIn, function (req, res) { 
  var id = req.user.id;
  User.findByIdAndUpdate(id, { state : req.body.state }, 
  function (err, docs) { 
    if (err){ 
      console.log(err) 
    } 
    else{ 
      //console.log("Updated User : ", docs); 
    } 
  });
});

app.get("/table", isLoggedIn, function (req, res) { 
  var id = req.user.id;
  User.findOne({_id: id}, function (err, user) {
    if (err) return res.json(400, {message: `user ${id} not found.`});
    res.json(user);
  });
}); 


function isLoggedIn(req, res, next) { 
  if (req.isAuthenticated()) return next(); 
  res.redirect("/"); 
} 

var port = process.env.PORT || 3000; 
app.listen(port, function () { 
    console.log("Server Has Started!"); 
}); 
