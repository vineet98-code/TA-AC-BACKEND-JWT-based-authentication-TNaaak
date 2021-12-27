var jwt = require("jsonwebtoken");

module.exports = {
    verifyToken: async function (req, res, next) {
        // console.log(req.headers);
        var token = req.headers.authorization;
        try {
            if (token) {
                var payload = await jwt.verify(token, "thisisasecreat");
                req.user = payload;
               return next();
            } else{
                return res.status(400).json({message: "Token required" });
            }
        } catch (err) {
            console.log(err);
            next(err);
        }   
    },
    optionalAuth: async function (req, res, next) {
        // console.log(req.headers);
        var token = req.headers.authorization;
        try {
            if (token) {
                var payload = await jwt.verify(token, "thisisasecreat");
                req.user = payload;
               return next();
            } else{
               req.user = null;
               next();
            }
        } catch (err) {
            console.log(err);
            next(err);
        }   
    }
}