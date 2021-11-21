var express = require('express');
var User = require('../models/User');
var auth = require('../middleware/auth');
var fs = require('fs');
var path = require('path');
const { token } = require('morgan');
var router = express.Router();


// GET current user 
router.get('/', auth.verifyToken, async (req, res, next) => {
  try {
    let user = await User.findById(req.user.userId);
    res.json({user:{
        email:user.email,
        token:token,
        username: user.username,
        bio: user.bio,
        following: user.following
    }})
  } catch (error) {
      res.json(error);
  }
})

// UPDATE current user 
router.put('/', auth.verifyToken,  async (req, res, next) => {
    try {
        let user = await User.findById(req.user.userId);
        if(req.file){
            req.body.image = req.file.filename;
            let imageFilePath = await path.join(__dirname, '..', 'uploads', user.image);
            fs.unlink(imageFilePath,(error)=>{
                //how to use fs with async await??
                if(error)  return res.json({error});
            });
        }
        let updatedUser = await User.findByIdAndUpdate(user.id, req.body, {new: true});
        res.json(updatedUser);
    } catch (error) {
        next(error);
    }
})

module.exports = router;