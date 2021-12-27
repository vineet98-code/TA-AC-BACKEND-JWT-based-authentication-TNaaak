var express = require('express');
var router = express.Router();
var User = require('../models/User');
var auth = require('../middleware/auth');
var Article = require('../models/Article');
var Comment = require('../models/Comment');
var slug = require('slug');

// create articles
router.post('/', auth.verifyToken, async (req, res, next) => {

    try {
        req.body.slug = await slug(req.body.title);
        req.body.author = req.user.userId;

        const article = await Article.create(req.body);

        var articleData = await Article.findOne({ _id: article._id }).populate("author","username email following" ).populate("comments").exec();
            
            return res.json({ 
                article: articleData.toJSONFor() })
    } catch (error) {
        next(error);
    }
});


// Get all articles
router.get('/', auth.optionalAuth, async function (req, res, next) {
    const query = {}
    const { limit, offset} = req.query
  
    if (typeof req.query.tag !== 'undefined') {
      query.tagList = { $in: [req.query.tag] }
    }
    
    Promise.all([
        req.query.author ? User.findOne({ username: req.query.author }) : null,
        req.query.favorited ? User.findOne({ username: req.query.favorited }) : null
    ]).then(function (results) {
        const [author, favoriter] = results
        
        if (author) {
            query.author = author._id
        } else if (req.query.author) {
            query._id = { $in: [] }

        }
        if (favoriter) {
            query._id = { $in: favoriter.favorites }
        } else if (req.query.favorited) {
            query._id = { $in: [] }
        }
        console.log(query);
       return Promise.all([
        Article.find(query)
          .limit(Number(limit))
          .skip(Number(offset))
          .sort({ createdAt: -1 }) // -1 means descending order, +1 means ascending order
          .populate('author')
          .exec(),
        Article.countDocuments(query).exec(),
        req.user ? User.findById(req.user.id) : null
      ]).then((results) => {
        const [articles, articlesCount, user] = results
  
        return res.json({
          articles: articles.map((article) => {
            return article.toJSONFor(user);

          }),
          articlesCount: articlesCount
        })
      })
    }).catch(next)
  }
);

// Feed articles are articles that are published by the user

router.get('/feed', auth.verifyToken, async (req, res, next) => {
    console.log({ user: req.user })

    var limit = 20;
    var offset = 0;

    if (typeof req.query.limit !== 'undefined') {
        limit = req.query.limit;
    }

    if (typeof req.query.offset !== 'undefined') {
        offset = req.query.offset;
    }
    const user = await User.findById(req.user.userId)

    console.log({ user })

    Article.find({ author: { $in: user.following } })
        .limit(Number(limit))
        .skip(Number(offset))
        .populate('author').populate('comments')
        .exec((err, articles) => {
            if (err) {
                res.status(500).json({ success: false, data: null, err })
            }

            console.log({ success: true, articles })
            res.status(200).json({ success: true, data: articles, err: null })
        })

});

// Get all tags
router.get('/tags', async (req, res, next) => {
    try {
        let tags = await Article.distinct('tagList');
        res.status(200).json({ tags: tags });
    } catch (error) {
        next(error);
    }
});

// Fetch Single article
router.get('/:slug', async (req, res, next) => {
    let slug = req.params.slug;
    const match = {};
    
    try {
        const singleArticle = await Article.findOne({slug}, req.body).populate('author', 'username email following').populate("comments").exec();
        console.log({ singleArticle })  
        return res.json({ article: singleArticle.toJSONFor() });
    } catch (error) {
        next(error);
    }
});


// Update Articles 
router.put('/:slug', auth.verifyToken, async (req, res, next) => {
    var slug = req.params.slug;
    try {
        var updatedArticle = await Article.findOneAndUpdate({ slug }, req.body, { new: true }).populate("author","username email").exec();
        res.status(200).json({ article: updatedArticle });
    } catch (err) {
        next(err);
    }
});

// Delete article
router.delete('/:slug', auth.verifyToken, async (req, res, next) => {
    var slug = req.params.slug;
    try {
        var article = await Article.findOneAndDelete({ slug });
        res.status(200).json({ msg: 'Article is successfully deleted' });
    } catch (error) {
        next(error);
    }
});


// Create comments to an Article
router.post('/:slug/comments', auth.verifyToken, async (req, res, next) => {
    try {
        let slug = req.params.slug;
        req.body.author = req.user.userId;
        
       const comment = await Comment.create(req.body);
        const commentData = await Comment.findOne({ _id: comment._id }).populate("author","username email following ").exec();
        res.status(200).json({ comment: commentData.toJSONForComments() });
    } catch (error) {
        next(error);
    }
});

// Get comments from article
router.get('/:slug/comments', async (req, res, next) => {
    let slug = req.params.slug;
    try {
        const comments = await Comment.findOne({ slug }).populate("author","username email").exec();
        res.status(200).json({ comments: comments.toJSONForComments() });
    } catch (error) {
        next(error);
    }
});

//Delete Comments
router.delete('/:slug/comments/:id', auth.verifyToken, async (req, res, next) => {
    let slug = req.params.slug;
    let id = req.params.id;
    try {
        var article = await Article.findOne({ slug });
        var comment = await Comment.findOneAndDelete({ _id: id });
        res.status(200).json({ msg: 'Comment is successfully deleted' });
    } catch (error) {
        next(error);
    }
});

// Favorite Article
router.post('/:slug/favorite', auth.verifyToken, async (req, res, next) => {
    let slug = req.params.slug;
    
    try {
        let article = await Article.findOne({ slug });
        let user = await User.findOne({ _id: req.user.userId });
    
        let updatedArticle = await Article.findOneAndUpdate(
            { slug }, 
            { $push: {favoriteList: user._id }, $inc: { favoritesCount: 1 }},  
            { returnNewDocument: true }
        );
        let updatedUser = await User.findOneAndUpdate(user._id, {
            $push: { favoritedArticles: updatedArticle._id },
        });
        console.log(updatedArticle);
        console.log(updatedUser);
        
         res.json({ article: updatedArticle });
    } catch (error) {
        next(error);
    }
});

// UnFavorite Article
router.delete('/:slug/favorite', auth.verifyToken, async (req, res, next) => {
    let slug = req.params.slug;
    
    req.body.author = req.user.userId;
    try {
        let user = await User.findOne({ _id: req.user.userId });
    
        let updatedArticle = await Article.findOneAndUpdate({ slug }, { $pull: {favoriteList: user._id }, $inc: { favoritesCount: -1 }},  { new: true }).populate("author","username email").exec();

        let updatedUser = await User.findByIdAndUpdate(user._id, {
            $pull: { favoritedArticles: updatedArticle._id },
          });
         res.json({ article: updatedArticle });
    } catch (error) {
        next(error);
    }
});

module.exports = router;


// Following, article router filter, feed, single article, follow and unfollow