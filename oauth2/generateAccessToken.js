var serializer = require('serializer');



var options = {
	crypt_key : 'api.cc98.org',
	sign_key : 'cc98.org'
}

function tokenProvider() {
	this.serializer = serializer.createSecureSerializer(options.crypt_key, options.sign_key);
}

tokenProvider.prototype.generateAccessToken = function (user_id, client_id, extra_data) {
	access_token = this.serializer.stringify([user_id, client_id, +new Date, extra_data]);
	//console.log(access_token);
	return access_token;
}

tokenProvider.prototype.generateRefreshToken = function (user_id, client_id, extra_data) {
	refresh_token = this.serializer.stringify([user_id, client_id, +new Date, extra_data, 'refresh_token']);
	//console.log(refresh_token);
	return refresh_token;
}

module.exports = tokenProvider;