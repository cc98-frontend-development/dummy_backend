var check = require('./check');

exports.secret = function (req, res) {
	check(req, res, function (err, req ,res) {
		if (err) {
			res.send(err);
		}
		else {
			res.send('secret content.');
		}		
	});
}