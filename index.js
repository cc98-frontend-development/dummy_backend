var express = require('express'),
	bodyParser = require ('body-parser'),

	app = express(),
	routes = require('./routes');


app.use(bodyParser.urlencoded({ extended: false }))
app.use(routes.api);
app.listen (8080);