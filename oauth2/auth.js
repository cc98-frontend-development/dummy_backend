var tokenProvider = require('./generateTokens');
var tempStorage = require('./tempStorage');
var promise = require('./../lib/promise');


var myProvider = new tokenProvider();

var client = tempStorage.client;

var user = tempStorage.user;

var extra_data = 'extra';

var myGrants = tempStorage.myGrants;



var STATE_GRANTED = 1;
var StATE_NO_GRANTED = 0;
var EXPIRES_TIME = 3600;

var D = true;

function auth (req, res) {//traffic limititation does not apply.
	if (D) {
		console.log('start auth.');
	}
    var resolve = new promise.Resolve(req);
    resolve.thenProceed(checkClient)
        .thenProceed(checkScope)
        .thenProceed(checkGrantType)
        .thenProceed(checkAuthenticationCredentials)
        .thenProceed(checkIfGranted)
        .thenProceed(processToken)
        .thenProceed(function (token) {
            console.log (token);
            res.send (token);
        }, handleError(res));
}


//send error info to response
var handleError = function (res) {
    return function (err) {
        console.log (err);
        res.status(400).send ({
            error : err.message
        });
    }
}


//check if client id and secret are right
var checkClient = function (req) {
    if (D) {
        console.log('start check client.');
    }

    if (req.body.client_id != client.id || req.body.client_secret != client.secret) {
        throw  new Error ('invalid_client');
    }
    else {
        return req;
    }
}


//check if scope is allowed
var checkScope = function (req) {
    if (D) {
        console.log('start check scope.');
    }

    if (req.body.scope != 'api.cc98.org') {
        throw  new Error ('invalid_scope');
    }
    else {
        return req;
    }
}


//check if granttype is allowed
var checkGrantType = function (req) {
    if (D) {
        console.log('start check grant type.');
    }

    if (req.body.grant_type == 'password' || req.body.grant_type == 'refresh_token') {
        return req;
    }
    else {
        throw new Error ('unsupported_grant_type');
    }
}


//check username/password or refresh_token
var checkAuthenticationCredentials = function (req) {
    if (D) {
        console.log('start checkAuthenticationCredentials.');
    }

    switch (req.body.grant_type) {
        case 'password':
            if (req.body.username != user.username || req.body.password != user.password) {
                throw new Error ('invalid_request');
            }
            else {
                return req;
            }
            break;
        case 'refresh_token':
            if (!checkRefreshTokenExist(req)) {
                throw new Error ('invalid_request');
            }
            else {
                return req;
            }
            break;
    }
}


//check refresh_token exits
var checkRefreshTokenExist = function (req) {
    if (D) {
        console.log('start checkRefreshTokenExist.');
    }

    for (eachUser in myGrants) {
        for (eachClient in myGrants[eachUser]) {
            if (myGrants[eachUser][eachClient]['refresh_token'] == req.body.refresh_token) {
                console.log (myGrants);
                req.body.username = eachUser;
                return true;
            }
        }
    }
    return false;
}


//check is token already valid.
var checkIfGranted  = function (req) {
    if (D) {
        console.log('start check if granted.');
    }

    req.body.state = StATE_NO_GRANTED;
    if (req.body.username in myGrants) {
        if (req.body.client_id in myGrants[req.body.username]) {
            if (myGrants[req.body.username][req.body.client_id]['expires_time'] > +new Date) {
                req.body.state = STATE_GRANTED;
            }
        }
    }
    return req;
}


var processToken = function (req) {
    if (D) {
        console.log('start process Token.');
    }

    var token;

    if (req.body.state == STATE_GRANTED) {
        token = updateToken(req);
    }
    else if (req.body.state == StATE_NO_GRANTED) {
        token = createToken(req);
        saveToken(req, token);
    }
    return token;
}


//create new token object
var createToken = function (req) {
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
    return token;
}


//save token object to storage
var saveToken = function (req, token) {
	if (D) {
		console.log('start save Token.');
	}	
	if (!(req.body.username in myGrants)) {
		myGrants[req.body.username] = {};
	}
	myGrants[req.body.username][req.body.client_id] = {};
	myGrants[req.body.username][req.body.client_id]['access_token'] = token.access_token;
	myGrants[req.body.username][req.body.client_id]['refresh_token'] = token.refresh_token;
	myGrants[req.body.username][req.body.client_id]['expires_time'] = +new Date + EXPIRES_TIME * 1000;
	return token;
}


//update token expires_time
var updateToken = function (req) {
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
	return token;
}


module.exports = auth;