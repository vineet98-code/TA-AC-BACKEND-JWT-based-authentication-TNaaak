var mongoose = require('mongoose');
let slug = require('mongoose-slug-generator');
var uniqueValidator = require('mongoose-unique-validator');
var User = require('../models/User');
var Schema = mongoose.Schema;

var articleSchema = new Schema({
  title: { type: String, unique: true },
  slug: { type: String, slug: 'title', lowercase: true, unique: true },
  description: { type: String },
  body: { type: String },
  tagList: [{ type: String }],
  comments: [{ type: Schema.Types.ObjectId, ref: 'Comment', required: true }],
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  favoriteList: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  favoritesCount: { type: Number, default: 0 },

}, { timestamps: true }
);

articleSchema.plugin(uniqueValidator, { message: 'is already taken' });


articleSchema.methods.updateFavoriteCount = function () {
  var article = this;

  return User.count({ favorites: { $in: [article._id] } }).then(function (count) {
    article.favoritesCount = count;

    return article.save();
  });
};


articleSchema.methods.toJSONFor = function(user) {
  return {
    slug: this.slug,
    title: this.title,
    description: this.description,
    body: this.body,
    tagList: this.tagList,
    favorited: user ? user.isFavorite(this._id) : false,
    favoritesCount: this.favoritesCount,
    author: {
      username: this.author.username,
      bio: this.author.bio,
      email: this.author.email,
      image: this.image || 'https://static.productionready.io/images/smiley-cyrus.jpg',
      following: user ? user.isFollowing(this._id) : false
    }
  };
};

module.exports = mongoose.model('Article', articleSchema);