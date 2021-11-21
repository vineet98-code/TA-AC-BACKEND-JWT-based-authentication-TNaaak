var express = require('express');
var router = express.Router();
var jwt = require("jsonwebtoken");
var User = require('../models/User');
var Article = require('../models/Article');



// create articles
router.post('/', async (req, res, next) => {
    // req.body.tags = req.body.tags.split(" ");// split into a space so that converted into an array
    try {
        var article = await Article.create(req.body)
        res.status(200).json( {article});
    } catch (error) {
        next(error);
    }
});

// listing all articles
router.get('/', async (req, res, next) => {
    try{
        var articles = await Article.find().populate('author');
        res.status(200).json({articles});
    } catch(error){   
        next(error);
    }  
});

// Fetch Single article
router.get('/:id', (req, res, next) => {
    try{
        var article = Article.findById(req.params.id).populate('author');
        res.status(200).json({article});
    }catch(error){
        next(error);
    }
});

module.exports = router;
