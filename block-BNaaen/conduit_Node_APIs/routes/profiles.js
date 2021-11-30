var express = require('express');
var router = express.Router();
var jwt = require("jsonwebtoken");
var User = require('../models/User');
var auth = require('../middleware/auth');


//Get Profile

router.get('/:username', auth.verifyToken, async (req, res, next) => {
  console.log(req.params.username);
  try {
    let username = req.params.username;
    let user = await User.findOne({ username });
    if (user) {
      res.status(201).json({
        profile: { 
          username: user.username,
          bio: user.bio,
          image: user.image,
          following: user.following,
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
    let userToFollow = await User.findOne({ username });
    if (!userToFollow) {
      return res.status(400).json({ errors: 'User not available'});
    }
    await User.findByIdAndUpdate(userToFollow.id, {$push: { followers: req.user.userId },
    });
    var currentUser = await User.findByIdAndUpdate(
       req.user.userId,
      { $push: { following: userToFollow.id } },
      { new: true }
    );
    res.json({
      profile: {
        username: currentUser.username,
        bio: currentUser.bio,
        image: currentUser.image,
        following: currentUser.following,
      },
    });
  } catch (error) {
    next(error);
  }
});

// unfollow user
router.delete("/:username/follow", auth.verifyToken, async (req, res, next) => {
  console.log(req.user);
  try {
    var username = req.params.username;
    var userToUnfollow = await User.findOne({ username });
    if (!userToUnfollow)
      return res.status(404).json({ error: "User not available!" });

      await User.findByIdAndUpdate(userToUnfollow.id, {
      $pull: { followers: req.user.userId },
    });
    var currentUser = await User.findByIdAndUpdate(
      req.user.userId,
      { $pull: { following: userToUnfollow.id } },
      { new: true }
    );
    res.json({
      profile: {
        username: currentUser.username,
        bio: currentUser.bio,
        image: currentUser.image,
        following: currentUser.following,
      },
    });
  } catch (error) {
    next(error);
  }
});
  
 module.exports = router;