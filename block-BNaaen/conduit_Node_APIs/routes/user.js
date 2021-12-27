var express = require('express');
var User = require('../models/User');
var auth = require('../middleware/auth');
var fs = require('fs');
var path = require('path');
const { token } = require('morgan');
var router = express.Router();


// GET current user 
router.get('/', auth.verifyToken,  async (req, res, next) => {
    console.log(req.user);
    try {
    let user = await User.findById(req.user.userId);
    console.log(user);
    res.status(200).json({ user: user.userJSON() });
    } catch (error) {
        next(error);
    }
})

//Update User
router.put('/', auth.verifyToken, async (req, res, next) => {
    console.log(req.user);
    
    try {
      let user = await User.findByIdAndUpdate(req.user.userId,  { new: true });
      
      return res.status(200).json({ user: user.userJSON()});
    } catch (error) {
      next(error);
    }
  });

module.exports = router;