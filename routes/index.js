var express = require('express');
var router = express.Router();
const userModel = require('./users');
const postModel = require('./posts');
const passport = require('passport');
const localStrategy = require('passport-local');
passport.use(new localStrategy(userModel.authenticate()));
const upload = require('./multer');

router.get('/', function(req, res, next) {
  res.render('index');
});


router.post('/register', function(req, res, next) {
  const userData = new userModel({
    username: req.body.username,
    email: req.body.email,
    fullname: req.body.fullname,
  });
  userModel.register(userData, req.body.password)
  .then(function () {
    passport.authenticate('local')(req, res, function(){
      res.redirect('/profile')
    })
  })
});
router.get('/login', function(req, res, next) {
  res.render('login', { error: req.flash('error')});
});


router.post('/login',passport.authenticate('local',{
successRedirect: '/profile',
failureRedirect: '/login',
failureFlash: true,
}), function(req, res, next) {
  res.render('login', { title: 'Express' });
});



router.get('/logout', function(req, res, next) {
  req.logout(function(err){
   if(err) { return next(err); }
   res.redirect('/login');
  })
 });
 
 
 function isLoggedIn(req, res, next){
   if(req.isAuthenticated()) return next();
   res.redirect('/login');
 }
 

router.post('/fileupload', isLoggedIn, upload.single('image'), async function(req, res, next) {
  let user = await userModel.findOne({
    username: req.session.passport.user})
    user.dp = req.file.filename;
   await user.save();
   res.redirect('/profile')
});

router.get('/profile', isLoggedIn, async function(req, res, next) {
  let user = await userModel.findOne({
    username: req.session.passport.user,
  })
  .populate("posts")
  console.log(user)
  res.render('profile', {user});
});


router.get('/feed', function(req, res, next) {
  res.render('feed');
});


router.post('/upload',isLoggedIn, upload.single('file'), async (req, res) => {
if(!req.file){
  return res.status(400).send('no files were uploaded.');
}
const user = await userModel.findOne({ username: req.session.passport.user});
const post = await postModel.create({
  image: req.file.filename,
  postText: req.body.imagetext,
  user: user._id,
})
  user.posts.push(post._id);
  await user.save();
 res.redirect('/profile');
});



module.exports = router;
