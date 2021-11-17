var express = require('express');
var router = express.Router();
var auth = require('../middleware/auth');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/dashboard', auth.verifyToken, (req, res, next) => { 
  console.log(req.user);
  res.json({ access: "protected resources "})
})

module.exports = router;