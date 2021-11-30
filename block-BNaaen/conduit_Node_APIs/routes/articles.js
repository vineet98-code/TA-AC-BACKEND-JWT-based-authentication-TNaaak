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

        await Article.findOne({ _id: article._id }).populate("author","username email").populate("comments").exec((err, articleData) => {
            if (err) {
                return res.status(500).json({ success: false, err, data: null })
            }
            return res.json({ data: articleData })
        });

    } catch (error) {
        next(error);
    }
});



// listing all articles
router.get('/', async (req, res, next) => {
    var query = {};
    var limit = 20;
    var offset = 0;

    if (typeof req.query.limit !== 'undefined') {
        limit = req.query.limit;
    }

    if (typeof req.query.offset !== 'undefined') {
        offset = req.query.offset;
    }

    if (typeof req.query.tag !== 'undefined') {
        query.tagList = { "$in": [req.query.tag] };
    }


    Promise.all([
        req.query.author ? User.findOne({ username: req.query.author }) : null,
        req.query.favorited ? User.findOne({ username: req.query.favorited }) : null
    ]).then(function (results) {
        var author = results[0];
        var favoriter = results[1];

        if (author) {
            query.author = author._id
        }

        if (favoriter) {
            query._id = { $in: favoriter.favorites }
        } else if (req.query.favorited) {
            query._id = { $in: [] }
        }
        return Promise.all([
            Article.find(query)
                .limit(Number(limit))
                .skip(Number(offset))
                .sort({ createdAt: 'desc' })
                .populate('author')
                .exec(),
            Article.count(query).exec(),
            req.payload ? User.findById(req.payload.id) : null
        ]).then((results) => {
            var articles = results[0];
            var articlesCount = results[1];
            var user = results[2];

            return res.json({
                articles: articles.map((article) => {
                    return article.toJSONFor(user)
                }),
                articlesCount: articlesCount,

            })
        })
    }).catch(next)
});


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
        .populate('author')
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
        let tags = await Article.find().distinct('tagList');
        res.status(200).json({ tags: tags });
    } catch (error) {
        next(error);
    }
});

// Fetch Single article
router.get('/:slug', async (req, res, next) => {
    console.log({ slug: req.params.slug })
    try {
        req.body.slug = await slug(req.body.title);
        req.body = req.user.userId;
        
        await Article.findOne({slug}, req.body ).populate("author","username email").exec((err, articleData) => {
            if (err) {
                return res.status(500).json({ success: false, err, data: null })
            }
            
        });
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
        const commentData = await Comment.findOne({ _id: comment._id }).populate("author","username email").exec();
        res.status(200).json({ comment: commentData });
    } catch (error) {
        next(error);
    }
});

// Get comments from article
router.get('/:slug/comments', async (req, res, next) => {
    let slug = req.params.slug;
    try {
        const comments = await Comment.find({ slug }).populate("author","username email").exec();
        res.status(200).json({ comments: comments });
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
    
    req.body.author = req.user.userId;
    try {
        let user = await User.findOne({ _id: req.user.userId });
    
        let updatedArticle = await Article.findOneAndUpdate({ slug }, { $push: {favoriteList: user._id }, $inc: { favoritesCount: 1 }},  { returnNewDocument: true }).populate("author","username email").exec();

        let updatedUser = await User.findByIdAndUpdate(user._id, {
            $push: { favoritedArticles: updatedArticle._id },
          });
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
    
        let updatedArticle = await Article.findOneAndUpdate({ slug }, { $pull: {favoriteList: user._id }, $inc: { favoritesCount: -1 }},  { returnNewDocument: true }).populate("author","username email").exec();

        let updatedUser = await User.findByIdAndUpdate(user._id, {
            $push: { favoritedArticles: updatedArticle._id },
          });
         res.json({ article: updatedArticle });
    } catch (error) {
        next(error);
    }
});

// Follow Article
router.post('/:slug/follow', auth.verifyToken, async (req, res, next) => {
    let slug = req.params.slug;
    try {
        var article = await Article.findOneAndUpdate({ slug }, { $inc: { follow: 1 } });
        res.status(200).json({ article });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
