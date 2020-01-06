/*eslint no-console: 0*/
"use strict";

var http = require("http");
var url = require("url");
var port = process.env.PORT || 3000;
function start(route, handle) {

	http.createServer(function(request, response) {
		var pathname = url.parse(request.url).pathname;
		route(handle, pathname, response, request);
	}).listen(port);

	console.log("Server has started.");
}

exports.start = start;
