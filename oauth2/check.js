var tempStorage = require('./tempStorage');

var myGrants = tempStorage.myGrants;

module.exports = function (req, res, callback) {
	for (eachUser in myGrants) {
		for (eachClient in myGrants[eachUser]) {
			if (myGrants[eachUser][eachClient]['access_token'] == req.body.access_token) {
				if (myGrants[eachUser][eachClient]['expires_time'] > +new Date) {
					callback (null, req, res);
				}
				else {
					callback ({
						error : 'invalid_grant',
						error_description : 'expired access token',
						error_uri : 'auth.cc98.org/token'
					}, req, res);
				}
				return;
			}
		}
	}
	callback ({
		error : 'invalid_grant',
		error_description : 'invaild access token',
		error_uri : 'auth.cc98.org/token'
	}, req, res);
}
