let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let commentSchema = new Schema(
  {
    body: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    article: { type: Schema.Types.ObjectId, ref: 'Article' },

  }, { timestamps: true }
);

commentSchema.methods.toJSONForComments = function(user) {
  return {
    id: this._id,
    body: this.body,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    
    author: {
      username: this.author.username,
      bio: this.author.bio,
      email: this.author.email,
      image: this.image || 'https://static.productionready.io/images/smiley-cyrus.jpg',
      following: user ? user.isFollowing(this._id) : false
    }
  };
};


module.exports = mongoose.model('Comment', commentSchema);