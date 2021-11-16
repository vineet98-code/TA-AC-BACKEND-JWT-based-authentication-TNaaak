var express = require('express');
var router = express.Router();
var jwt = require("jsonwebtoken");


var User = require('../models/User');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.json({ message: 'Users Information' })
});

// Registration handler
router.post('/register', async (req, res, next) => {
  try {
    var user = await User.create(req.body);
    console.log(user);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
    }
});
  
// Login handler

router.post('/login', async (req, res, next) => {
  var { email, password } = req.body;
  if(!email || !password) {
    return res.status(422).json({ error: 'You must provide email and password'});
  }

  try {
    var user = await User.findOne({ email });
    if (!user) {
        res.status(401).json({ message: 'Email not registered' });
      } 
    var result  = await user.verifyPassword(password);
    if(!result) {
      return res.status(400).json({ error: 'Invalid password' });
    } 
    // Generate token
    var token = await user.signToken();
    res.json({ user, token } );
    console.log(token);
  } catch (err) {
    next(err);
  }
});



module.exports = router;