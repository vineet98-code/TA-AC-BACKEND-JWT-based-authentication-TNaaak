var express = require('express');
var router = express.Router();
var jwt = require("jsonwebtoken");
var User = require('../models/User');
var auth = require('../middleware/auth');


//Get Profile

router.get('/:username', auth.optionalAuth, async (req, res, next) => {
  console.log(req.user);
  try {
    let username = req.params.username;
    let user = await User.findOne({ username });
    if (user) {
      res.status(201).json({
        profile: { 
          username: user.username,
          bio: user.bio,
          image: user.image,
          following: user ? user.isFollowing(this._id) : false,
          followers: user ? user.isFollowing(this._id) : false
        }
      });
    } else {
       res.status(404).json({message: "User not found" });
      }
  } catch (error) {
      next(error);
    }
});

//Follow user

router.post('/:username/follow', auth.verifyToken, async (req, res, next) => {
  console.log(req.user);
  
  try {
    let username = req.params.username;
    let user = await User.findOne({ username });  // loggedin user
    let currentUser = await User.findOneAndUpdate(req.user._id, { $addToSet: { following: user._id } }, { new: true }); // iska id usme uska id isme
    let followerUser = await User.findOneAndUpdate(req.user._id, { $addToSet: { follower: currentUser._id } }, { new: true });

    res.status(201).json({
      Profile: {
        username: user.username,
        bio: user.bio,
        image: user.image,
        following: currentUser ? currentUser.isFollowing(user._id) : false,
        followers: followerUser ? followerUser.isFollowing(currentUser._id) : false
 }
  });

} catch (error) {
    next(error);
  }
});


// unfollow user
router.delete('/:username/follow', auth.verifyToken, async (req, res, next) => {
  // console.log(req.user);
  
  try {
    let username = req.params.username;
    let user = await User.findOne({ username });  // loggedin user
    let currentUser = await User.findOneAndUpdate(req.user._id, { $pull: { following: user._id } }, { new: true }); // iska id usme uska id isme
    let followerUser = await User.findOneAndUpdate(req.user._id, { $pull: { follower: currentUser._id } }, { new: true });

    res.status(201).json({
      Profile: {
        username: user.username,
        bio: user.bio,
        image: user.image,
        following: currentUser ? currentUser.isFollowing(user._id) : false,
        followers: followerUser ? followerUser.isFollowing(currentUser._id) : false
 }
  });

} catch (error) {
    next(error);
  }
});
  
 module.exports = router;