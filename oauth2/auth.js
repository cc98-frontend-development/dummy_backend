var tokenProvider = require('./generateAccessToken');
var tempStorage = require('./tempStorage');

var myProvider = new tokenProvider();

var client = tempStorage.client;

var user = tempStorage.user;

var extra_data = 'extra';

var myGrants = tempStorage.myGrants;



var STATE_GRANTED = 1;
var StATE_NO_GRANTED = 0;
var EXPIRES_TIME = 3600;

var D = false;

function auth (req, res) {//traffic limititation does not apply.
	if (D) {
		console.log('====================start auth.=====================');
	}	
	checkClient(req, res, function (err, req, res) {
		if (err) {
			sendAuthError (res, err);
			return;
		}
		checkScope(req, res, function (err, req, res) {
			if (err) {
				sendAuthError (res, err);
				return;
			}
			checkGrantType(req, res, function (err, req, res) {
				if (err) {
					sendAuthError (res, err);
					return;
				}
				checkAuthenticationCredentials (req, res, function (err, req, res) {
					if (err) {
						sendAuthError (res, err);
						return;
					}
					checkIfGranted(req, res, function (req, res, state) {
						if (state == StATE_NO_GRANTED) {
							generateToken(req, res, function (req, res, token) {
								saveToken(req, res, token, function (res, token) {
									res.send(token);
								});
							});
						}
						else if (state == STATE_GRANTED) {
							updateToken(req, res, function (res, token) {
								res.send(token);
							});
						}
					});
				});
			});
		});
	});
}


function generateToken (req, res, callback) {
	if (D) {
		console.log('start generate Token.');
	}	
	var refresh_token;
	if (req.body.grant_type == 'password') {
		refresh_token = myProvider.generateRefreshToken(req.body.username, req.body.client_id, extra_data);
	}
	else if (req.body.grant_type == 'refresh_token') {
		refresh_token = myGrants[req.body.username][req.body.client_id]['refresh_token'];
	}
	var token = {
		access_token : myProvider.generateAccessToken(req.body.username, req.body.client_id, extra_data),
		token_type : 'bearer',
		expires_in : EXPIRES_TIME,
		refresh_token : refresh_token
	}
	callback (req, res, token);
}

function saveToken (req, res, token, callback) {
	if (D) {
		console.log('start save Token.');
	}	
	if (!(req.body.username in myGrants)) {
		myGrants[req.body.username] = {};
	}
	myGrants[req.body.username][req.body.client_id] = {};
	myGrants[req.body.username]['username'] = req.body.username;
	myGrants[req.body.username][req.body.client_id]['access_token'] = token.access_token;
	myGrants[req.body.username][req.body.client_id]['refresh_token'] = token.refresh_token;
	myGrants[req.body.username][req.body.client_id]['expires_time'] = +new Date + EXPIRES_TIME * 1000;
	callback (res, token);
}

function updateToken(req, res, callback) {
	if (D) {
		console.log('start update Token.');
	}	
	myGrants[req.body.username][req.body.client_id]['expires_time'] = +new Date + EXPIRES_TIME * 1000;

	var token = {
		access_token : myGrants[req.body.username][req.body.client_id]['access_token'],
		token_type : 'bearer',
		expires_in : EXPIRES_TIME,
		refresh_token : myGrants[req.body.username][req.body.client_id]['refresh_token']
	}
	callback (res, token);
}

function checkIfGranted (req, res, callback) {
	if (D) {
		console.log('start check if granted.');
	}	
	var state = StATE_NO_GRANTED;
	if (req.body.username in myGrants) {
		if (req.body.client_id in myGrants[req.body.username]) {
			if (myGrants[req.body.username][req.body.client_id]['expires_time'] > +new Date) {
				state = STATE_GRANTED;
			}			
		}
	}
	callback(req, res, state);
}



function checkClient(req, res, callback) {
	if (D) {
		console.log('start check client.');
	}	
	if (req.body.client_id != client.id || req.body.client_secret != client.secret) {
		callback('invalid_client', req, res);
	}
	else {
		callback(null, req, res);
	}
}

function checkScope (req, res, callback) {
	if (D) {
		console.log('start check scope.');
	}	
	if (req.body.scope != 'api.cc98.org') {
		callback ('invalid_scope', req, res);
	}
	else {
		callback(null, req, res);
	}
}

function checkGrantType(req, res, callback) {
	if (D) {
		console.log('start check grant type.');
	}	
	if (req.body.grant_type == 'password' || req.body.grant_type == 'refresh_token') {
		callback (null, req, res);
	}
	else {
		callback('unsupported_grant_type', req, res);
	}
}

function checkAuthenticationCredentials (req, res, callback) {
	if (D) {
		console.log('start checkAuthenticationCredentials.');
	}	
	switch (req.body.grant_type) {
	case 'password':
		if (req.body.username != user.username || req.body.password != user.password) {
			callback('invalid_request', req, res);
		}
		else {
			callback (null, req, res);
		}
		break;
	case 'refresh_token':
		if (!checkRefreshTokenExist(req)) {			
			callback('invalid_request', req, res);
		}
		else {
			callback(null, req, res);
		}
		break;
	}
}

function checkRefreshTokenExist (req) {
	if (D) {
		console.log('start checkRefreshTokenExist.');
	}	
	for (eachUser in myGrants) {
		for (eachClient in myGrants[eachUser]) {
			if (myGrants[eachUser][eachClient]['refresh_token'] == req.body.refresh_token) {
				req.body.username = eachUser;
				return true;
			}
		}
	}
	return false;
}

function sendAuthError (res, error) {
	var errMessage = {
		error : error
	}
	res.send(400, errMessage);
}


module.exports = auth;