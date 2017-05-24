  var express = require('express');
  var router = express.Router();
  var mongoose = require('mongoose');
  var session = require('express-session')
  var cookieParser = require('cookie-parser')
  mongoose.connect('mongodb://localhost/todo');

  var User = mongoose.model('User', { email: String, password: String,
    todo:[{title:String,done:{type:Boolean,default:false}}] });


    router.get('/',(req,res)=>{
      // console.log(User.find());
      var query = User.find().select('email').exec(function (err, users) {
        if (err) {
          console.log(err);
          return;
        };
        console.log(users);
      res.render('users/index', {title:'All Users',users});
      });


    });
    var currentUser={}
    router.get('/index',(req,res)=>{
      // console.log(User.find());
      //console.log(req.session.user.email);
        User.findOne({email:req.cookies.email}).exec(function (err, users) {
        if (err) {
          console.log(err);
          return;
        };
        currentUser=users.todo;
        console.log(currentUser);
      res.render('users/index', {title:'Todo List',currentUser});
      });


    });


  //========= Routing ===========
  router.route("/add").get(function(req, res, next) {
    res.render('users/add',{title:'SignUp'})
  }).post(function(req, res, next) {
    console.log(req.body);
    let flag= false;
  var newUser = new User(req.body);

  newUser.save(function (err) {
    if (err) {
      console.log(err);
      res.redirect('/users/add');
    } else {
      console.log('user added succesfully');
      res.redirect('/users/login');
    }
  });

  });


  //======== Login ==========
  router.route("/login").get(function(req, res, next) {

   //console.log(req.cookies.email);
   if(req.cookies.email){
    //  res.render('users/profile', {title: "Profile"})
      res.render('users/profile', {title: "Profile"})

   }else{
     res.render('users/login',{title:'Login'})
   }


  }).post(function(req, res, next) {
  User.find({$and: [
      {email: req.body.email},
      {password:req.body.password}
    ] },
   (err, result) => {

     if (err) return res.send(500, err)
     //res.send('User is deleted')
     //console.log(result);
     if(req.body.remmeber){
       console.log('remembered');
     res.cookie('email',req.body.email, {
      maxAge: 86400 * 1000, // 24 hours
      httpOnly: true, // http only, prevents JavaScript cookie access
      secure: false // cookie must be sent over https / ssl
  });
  }
  //  User.update({email: req.body.email}, {$set:{session : req.cookies["connect.sid"]}});
  //========== Handle Session ==========

  // var newUser = new User(req.body);
  req.session.user=result[0];
  console.log(result);
  console.log(req.session.user.email);
  //console.log("Session: ",req.session.email);

  res.redirect("/users/profile")
      //  res.render('users/profile', {user: result})
      //  res.end('done');
   });

  });
  //==================
  // var myFun = function (req, res, next) {
  //   if(!req.session.user)return
  //   next();
  //
  // }
  // router.use(function (req, res, next) {
  //   console.log(req.session.user);
  //   console.log(req.cookies.email);
  //   if(req.session.user)
  //   { console.log("right..");
  //   next();
  // }
  //   else{
  //     res.render('users/login',{title:'Login'})
  //   }
  //
  // });
  //======== profile =========
  router.route("/profile").get(function(req, res, next) {
    //  console.log('Cookies: ', req.cookies)
    res.render('users/profile',{title:'Profile'})
    console.log(req.session.user);
  })
  router.post("/profile",(req, res) => {
    //console.log(req.session.user.email);
    User.findOne({email:req.cookies.email},function(err,user){
      console.log(user);
      if(err)return handleError(err)
      user.todo.push({title:req.body.title});
      user.save(function (err,updatedUser) {
          if(err)return handleError(err)
          console.log(updatedUser);

      })
    });
  res.render('users/profile',{title:'Profile'})



  })

  //========= delete POst ======
  router.get('/delete/:id', (req, res) => {
    User.findOne({email:req.cookies.email},function(err,user){
      // console.log(user);
      if(err)return handleError(err)
      user.todo.pull({_id:req.params.id});
      user.save(function (err,updatedUser) {
          if(err)return handleError(err)
          console.log(updatedUser);

      })
    });
     res.redirect("/users/index");
})

//========= Make it Done=====
router.get('/status/:id', (req, res) => {
  User.findOneAndUpdate({email:req.cookies.email,"todo._id":req.params.id}, { $set:{ "todo.$.done":true } },function(err,user){

    res.redirect("/users/index");
  });

})
//======== update Title =======
router.route("/edit/:id").get(function(req,res,next){


  res.render('users/edit', {title:"Edit"})

}).post(function(req,res,next){
  User.findOneAndUpdate({email:req.cookies.email,"todo._id":req.params.id}, { $set:{ "todo.$.title":req.body.title } },function(err,user){

    res.redirect("/users/index");
  });




})

  //======= Logout =========
  router.get('/logout',function(req,res){
    res.clearCookie("email");
      req.session.destroy(function(err){
          if(err){
              console.log(err);
          } else {
              res.redirect('/');
          }
      });
  });
  //=============


  module.exports = router;
