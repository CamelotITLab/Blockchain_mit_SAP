/*eslint no-console: 0*/
const request = require("request");
const url = require("url");
const querystring = require("querystring");
const fs = require("fs");

const apikey = "EIGENEN_API_KEY_HIER_EINSETZEN";
const multichainurl = "URL_ZUM_AUFRUF_DER_MULTICHAIN_RPC_API_EINSETZEN";
const streamName = "EnergyMarket";
const assetName = "EnergyCoin";

function _multichainPost(methodName, params, cb) {
    request.post({
        headers: {
			"apikey": apikey
		},
        url: multichainurl,
		body: {
			"method": methodName,
			"params": params
		},
		json: true
    }, function(error, response, body) {
        if (error || body.error) {
            cb(error ? error : body.error);
        } else {
            cb(null, body);
        }
    });
}

function _hexEncode (sValue) {
	var hex, i;
	var result = "";
	for (i = 0; i < sValue.length; i++) {
		hex = sValue.charCodeAt(i).toString(16);
		result += ("0" + hex).slice(-2);
	}
	return result;
}

function _hexDecode (sValue) {
	var hexes = sValue.match(/.{1,2}/g) || [];
	var result = "";
	for (var j = 0; j < hexes.length; j++) {
		result += String.fromCharCode(parseInt(hexes[j], 16));
	}
	return result;
}
function _getUsers() {
    let userData = fs.readFileSync("./model/users.json", "utf8");
    userData = JSON.parse(userData);
    return userData;
}

function _validateUserId(userId, req, cb) {
	if (!userId) {
		userId = querystring.parse(url.parse(req.url).query).user;
	}
    console.log("-- User ---------------------------------------------------");
    console.log(userId);
    if (!userId) {
    	cb("MissingUserId");
    } else {
	    const userList = _getUsers();
	    const user = userList.find(u => u.userId === userId);
	    if (!user) {
	    	cb(`UnknownUser ${userId}`);
	    } else {
	    	cb(null, user);
	    }
	}
}

function _getUserBalance(user, cb) {
	const methodName = "getaddressbalances";
	const params = [user.address];
	let balance = 0;
	_multichainPost(methodName, params, function(error, data) {	
		if (data.result.length > 0) {
			data.result.map(e => {
				if (e.name == assetName) {
					balance = e.qty;
				} 
			});
		}
		cb(balance);
	});
}

function _getLatestProducts(rawData) {
	const products = new Map();
	rawData.map(e => {
		const productId = e.key;
		const product = JSON.parse(_hexDecode(e.data));
		if (!products.get(productId) || product.version > products.get(productId).version) {
			product.productId = productId;
			products.set(productId, product);
		}
	});
	return products;
}

function _getProductDetails(productId, cb) {
	const methodName = "liststreamkeyitems";
	const params = [streamName, productId, false, 100000];
	_multichainPost(methodName, params, function(error, data) {	
		if (!error && data.result.length > 0) {
			cb(_getLatestProducts(data.result).get(productId));
		} else {
		    cb(null);
		}
	});
}

function _generateProductId () {
	return (Date.now().toString(36) + Math.random().toString(36).substr(2)).toUpperCase();
}

function _transferAsset (user, offerorId, amount, cb) {
	const methodName = "sendassetfrom";
	const offeror = _getUsers().find(u => u.userId === offerorId);
	const params = [user.address, offeror.address, assetName, parseInt(amount)];
	_multichainPost(methodName, params, function(error, data) {	
		if (error) {
		    console.log("-- Error ---------------------------------------------------");
		    console.log(error);
			cb(error.toString());
		} else {
    		cb(null, "success");
		}
	});
}

function getUserList(req, cb) {
	const userList = _getUsers();
	cb(null, JSON.stringify(userList));
}

function getProductOfferings(req, cb, user, testFunction) {
	const methodName = "liststreamitems";
	const params = [streamName, false, 100000];
	_multichainPost(methodName, params, function(error, data) {	
		if (error) {
		    console.log("-- Error ---------------------------------------------------");
		    console.log(error);
			cb(error.toString());
		} else {
			const offerings = [];
			if (data.result.length > 0) {
				const products = _getLatestProducts(data.result);
				products.forEach((product) => {
					if (testFunction(product, user)) {
						offerings.push(product);
					}
				});
			}
			cb(null, JSON.stringify(offerings));
		}
	});
}

function getProductOfferingsForUser(req, cb) {
    _validateUserId(null, req, function(userError, user) {
		if (userError) {
			cb(userError);
		} else {
			getProductOfferings(req, cb, user, function(product, currentUser) {
				return product.offerorId == currentUser.userId;
			});
		}
    });
}

function getProductPurchasesForUser(req, cb) {
    _validateUserId(null, req, function(userError, user) {
		if (userError) {
			cb(userError);
		} else {
			getProductOfferings(req, cb, user, function(product, currentUser) {
				return product.buyerId == currentUser.userId;
			});
		}
    });
}

function getAvailableProductOfferings(req, cb) {
	getProductOfferings(req, cb, null, function(product) {
		return product.buyerId == "-";
	});
}

function getAccountBalance(req, cb) {
   _validateUserId(null, req, function(userError, user) {
    	if (userError) {
    		cb(userError);
    	} else {
    		_getUserBalance(user, function(balance) {
    			cb(null, balance.toString());
    		});
    	}
    });
}

function registerProductOffering(req, cb) {
	const methodName = "publish";
	let body = "";
    req.on("data", chunk => {
        body += chunk.toString(); // convert Buffer to string
    });
    req.on("end", () => {
    	const productData = JSON.parse(body);
		productData.productId = _generateProductId();
		productData.buyerId = "-";
		productData.version = 0;
		const productDataHex = _hexEncode(JSON.stringify(productData));
	    _multichainPost(methodName, [streamName, productData.productId, productDataHex], function(error) {
	    	if (error) {
			    console.log("-- Error ---------------------------------------------------");
			    console.log(error);
				cb(error.toString());
	    	} else {
	    		cb(null, "success");
	    	}
	    });
    });
}

function purchaseProduct(req, cb) {
	const methodName = "publish";
	let requestData = "";
    req.on("data", chunk => {
        requestData += chunk.toString(); // convert Buffer to string
    });
    req.on("end", () => {
    	requestData = JSON.parse(requestData);
    	_validateUserId(requestData.buyerId, req, function(userError, user){
	    	if (userError) {
	    		cb(userError);
	    	} else {
	    		_getUserBalance(user, function(balance) {
	    			_getProductDetails(requestData.productId, function(product) {
	    				if (!product) {
					    	cb("ProductNotFound");
	    				} else if (balance < product.productPrice) {
					    	cb("InsufficientFunds");
					    } else {
					    	product.buyerId = requestData.buyerId;
					    	product.version = product.version + 1;
					    	const productDataHex = _hexEncode(JSON.stringify(product));
						    _multichainPost(methodName, [streamName, requestData.productId, productDataHex], function(error) {
						    	if (error) {
								    console.log("-- Error ---------------------------------------------------");
								    console.log(error);
									cb(error.toString());
						    	} else {
						    		_transferAsset (user, product.offerorId, product.productPrice, cb);
						    	}
						    });
					    }
	    			});
	    		});
	    	}
    	});
    });
}

/* Bootstrapping functions - start */
function initBalance(user) {
	const methodName = "issuemore";
	const params = [user.address, assetName, user.openingBalance];
	_multichainPost(methodName, params, function(error, data) {	
		if (!error) {
		    console.log("-- Balance Initialised for " + user.userName + " ---------------------------------------------------");
		    console.log("-- issuemore response body ---------------------------------------------------");
		    console.log(data);
		}
	});
}
function initAsset() {
	const methodName = "issue";
	const users = _getUsers();
	const params = [users[0].address, {"name": assetName, "open": true}, 0];
	_multichainPost(methodName, params, function(error, data) {	
		if (!error) {
		    console.log("-- Asset Initialised ---------------------------------------------------");
		    console.log("-- issue response body ---------------------------------------------------");
		    console.log(data);
			for (let i = 0; i < users.length; i++) {
				initBalance(users[i]);
			}
		}
	});
}
function grantPermissions() {
	const methodName = "grant";
	const users = _getUsers();
	const addresses = users[0].address + "," +
						users[1].address + "," +
						users[2].address + "," +
						users[3].address;
	_multichainPost(methodName, [addresses, "connect,send,receive,issue"], function(error, data) {	
		if (!error) {
		    console.log("-- Permissions Granted ---------------------------------------------------");
		    console.log("-- grant response body ---------------------------------------------------");
		    console.log(data);
			initAsset();
		}
	});
}
function importAddresses () {
	const methodName = "importprivkey";
	const users = _getUsers();
	const params = [[
		users[0].privkey,
		users[1].privkey,
		users[2].privkey,
		users[3].privkey
	]];
	_multichainPost(methodName, params, function(error, data) {	
		if (!error) {
		    console.log("-- Addresses Imported ---------------------------------------------------");
		    console.log("-- importprivkey response body ---------------------------------------------------");
		    console.log(data);
			grantPermissions();
		}
	});
}
function createStream() {
	const methodName = "create";
	const params = ["stream", streamName, true];
	_multichainPost(methodName, params, function(error, data) {	
		if (!error) {
		    console.log("-- Stream created ---------------------------------------------------");
		    console.log("-- create response body ---------------------------------------------------");
		    console.log(data);
			importAddresses();
		} 
	});
}
/* Bootstrapping functions - end */

function init() {
	const methodName = "liststreams";
	_multichainPost(methodName, null, function(error, data) {
		let exists = false;
		for (let i = 0; i < data.result.length; i++) {
			if (data.result[i].name === streamName) {
				exists = true;
				break;
			}
		}
		if (!exists) {
		    console.log("-- Bootstrap stream and users ---------------------------------------------------");
			createStream();
		} else {
		    console.log("-- Stream exists ---------------------------------------------------");
		}
	});
}

function start(req, cb) {
	init();
    cb(null, "Energy Marketplace is available.");
}

exports.start = start;
exports.init = init;
exports.registerProductOffering = registerProductOffering;
exports.purchaseProduct = purchaseProduct;
exports.getAvailableProductOfferings = getAvailableProductOfferings;
exports.getProductOfferingsForUser = getProductOfferingsForUser;
exports.getProductPurchasesForUser = getProductPurchasesForUser;
exports.getAccountBalance = getAccountBalance;
exports.getUserList = getUserList;
