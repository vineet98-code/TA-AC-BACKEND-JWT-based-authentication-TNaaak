var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    username:{type: String, required: true},
    email: {type: String, required: true},
    bio:{type: String},
    image:{type: String}
})

module.exports = mongoose.model('User', userSchema);