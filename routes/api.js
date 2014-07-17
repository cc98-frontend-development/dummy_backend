var express = require('express');
var oauth2 = require('../oauth2');

var router = express.Router();

router.post('/token', function (req, res, next) {
	oauth2.auth(req, res);
});

router.post('/secret', function (req, res, next) {
	oauth2.secretTest(req, res);
});

module.exports = router;