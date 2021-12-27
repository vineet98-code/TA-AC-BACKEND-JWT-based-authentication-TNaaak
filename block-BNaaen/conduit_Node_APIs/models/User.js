var express = require('express');
var uniqueValidator = require('mongoose-unique-validator');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var Schema = mongoose.Schema;
var Article = require('../models/Article');

var bcrypt = require('bcrypt');

var userSchema = new mongoose.Schema({
    username: {type: 'string',  required: true},
    email: {type: 'string', lowercase: true, required: true, unique: true},
    bio: { type: String },
    image: {type: String },
    favorites: [{ type: Schema.Types.ObjectId, ref: 'Article' }],
    following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],

}, {timestamps: true});

userSchema.plugin(uniqueValidator, {message: 'is already taken.'});

// pre save hook
userSchema.pre('save', async function (next) {
    if (this.password && this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    } next();
});


// To verify password 
userSchema.methods.verifyPassword = async function (password) {
    try {
        var result =  await bcrypt.compare(password, this.password);
        return result;
      } catch (err) {
        return err;
    }
};

// Generate token to authenticate the user
userSchema.methods.signToken = async function() {
    var payload = { userId: this._id, email: this.email}; 
    try {
    var token = await jwt.sign(payload, "thisisasecreat");
    return token;
    } catch(err) {
        throw err;
    }
}

// Only passing the appropiarte fields to the user
userSchema.methods.userJSON = function(user, token) {
    return {
        username: this.username,
        email: this.email,
        bio: this.bio,
        image: this.image,
        token: token,
        following: this.user ? user.isFollowing(this._id) : false,
        followers: this.user ? user.isFollowers(this._id) : false
    }
}

// Profile method
userSchema.methods.toProfileJSONFor = function(user){
    return {
      username: this.username,
      bio: this.bio,
      image: this.image || 'https://static.productionready.io/images/smiley-cyrus.jpg',
      following: user ? user.isFollowing(this._id) : false
    };
};

userSchema.methods.isFollowing = function(id){
    return this.following.some(function(followId){
      return followId.toString() === id.toString();
    });
};

module.exports = mongoose.model('User', userSchema);