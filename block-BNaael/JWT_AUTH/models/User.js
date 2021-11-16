var express = require('express');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');

var bcrypt = require('bcrypt');

var userSchema = new mongoose.Schema({
    name: {type: 'string', required: true},
    email: {type: 'string', required: true, unique: true},
    password: {type: 'string', minlength: 5, required: true},
}, {timestamps: true});


userSchema.pre('save', async function(next) {
    if (this.password && this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    } next();
});


userSchema.methods.verifyPassword = async function(password) {
    try {
        var result =  await bcrypt.compare(password, this.password);
        return result;
      } catch (err) {
        throw err;
    }
};

userSchema.methods.signToken = async function() {
    var payload = {userId: this._id, email: this.email}; 
    try {
        var token = await jwt.sign(payload, "thisisasecreat");
        return token;
    } catch(err) {
        throw err;
    }
}

module.exports = mongoose.model('User', userSchema);