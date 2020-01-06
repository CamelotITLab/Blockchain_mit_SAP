<<<<<<< HEAD
/*eslint no-console: 0*/
function route(handle, pathname, response, request) {
	pathname = pathname.replace("middleware/","");
	if (typeof handle[pathname] === "function") {
		console.log(`Request handler ${pathname} was called.`);
		handle[pathname](request, function(error, result) {
	    	if (error) {
				console.log(`Error in request for ${pathname} - ${error}`);
				response.writeHead(500, {"Content-Type": "text/plain"});
				response.write(error);
				response.end();
	    	} else {
				console.log(`Success in request for ${pathname}`);
				response.writeHead(200, {"Content-Type": "text/plain"});
				response.write(result);
				response.end();
	    	}
		});
	} else if (!pathname.endsWith(".ico")) {
		console.log(`No request handler found for ${pathname}`);
	    response.writeHead(404, {"Content-Type": "text/plain"});
	    response.write("404 Not found");
	    response.end();
	}
}
=======
/*eslint no-console: 0*/
function route(handle, pathname, response, request) {
	pathname = pathname.replace("middleware/","");
	if (typeof handle[pathname] === "function") {
		console.log(`Request handler ${pathname} was called.`);
		handle[pathname](request, function(error, result) {
	    	if (error) {
				console.log(`Error in request for ${pathname} - ${error}`);
				response.writeHead(500, {"Content-Type": "text/plain"});
				response.write(error);
				response.end();
	    	} else {
				console.log(`Success in request for ${pathname}`);
				response.writeHead(200, {"Content-Type": "text/plain"});
				response.write(result);
				response.end();
	    	}
		});
	} else if (!pathname.endsWith(".ico")) {
		console.log(`No request handler found for ${pathname}`);
	    response.writeHead(404, {"Content-Type": "text/plain"});
	    response.write("404 Not found");
	    response.end();
	}
}
>>>>>>> aa2a2d90f0b22390ff6fd73bd4df7493eac18524
exports.route = route;