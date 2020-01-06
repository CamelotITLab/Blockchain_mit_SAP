/*eslint no-console: 0*/
const request = require("request");
const url = require("url");
const querystring = require("querystring");
const fs = require("fs");

const cfenv = require("cfenv");
const uaaService = cfenv.getAppEnv().getService("uaa_service");
const destinationService = cfenv.getAppEnv().getService("destination_service");
const destinationName = "hyperledger-fabric";
const uaaCredentials = `${destinationService.credentials.clientid}:${destinationService.credentials.clientsecret}`;
const uaaOptions = {
    url: uaaService.credentials.url + "/oauth/token",
    method: "POST",
    headers: {
        "Authorization": "Basic " + Buffer.from(uaaCredentials).toString("base64"),
        "Content-type": "application/x-www-form-urlencoded"
    },
    form: {
        "client_id": destinationService.credentials.clientid,
        "grant_type": "client_credentials"
    }
};	

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

function _authenticateRequest(cb) {
	request(uaaOptions, (uaaError, res, data) => {
	    if (res.statusCode === 200) {
	        const uaaToken = JSON.parse(data).access_token;
	        const destinationOptions = {
	            url: `${destinationService.credentials.uri}/destination-configuration/v1/destinations/${destinationName}`,
	            headers: {
	                "Authorization": "Bearer " + uaaToken
	            }
	        };
	        request(destinationOptions, (error, result, destinationData) => {
			    if (result.statusCode === 200) {
		            const oDestination = JSON.parse(destinationData);
		            const token = oDestination.authTokens[0];
		            const headers = {
			            "Accept": "application/json",
	        	        "Authorization": `${token.type} ${token.value}`
		            };
					cb(null, headers, oDestination.destinationConfiguration.URL);
				} else {
			    	cb(error);
				}
	        });
	    } else {
	    	cb(uaaError);
	    }
	});
}
function _blockchainGet(methodName, arg, cb) {
	const destinationPath = `${methodName}/${typeof arg === "string" ? arg : JSON.stringify(arg)}`;
	_authenticateRequest(function(authError, headers, destinationURL) {
		if (authError) {
			cb(authError);
		}
        request.get({
            headers: headers,
            url: destinationURL + destinationPath
        }, function(error, response, body) {
            if (error) {
				cb(error);
            } else {
				cb(null, body);
            }
	    });
    });
}
function _blockchainPost(methodName, formData, cb) {
	const destinationPath = methodName;
	_authenticateRequest(function(authError, headers, destinationURL) {
        if (authError) {
            cb(authError);
        }
        headers["Content-Type"] = "multipart/form-data" ;
        request.post({
            headers: headers,
            url: destinationURL + destinationPath,
            form: formData
        }, function(error, response, body) {
            if (error) {
                cb(error);
            } else {
                cb(null, body);
            }
        });
    });
}

function _calculateBalance(user, cb) {
	const methodName = "getProductOfferings";
    const salesFilter = {"selector":{"docType":"productOfferings", "status": 2}};
	salesFilter.selector.offerorId = user.userId;
	_blockchainGet(methodName, salesFilter, function(salesError, sales) {
		if (salesError) {
			cb(salesError);
		}
	    const purchasesFilter = {"selector":{"docType":"productOfferings"}};
       	purchasesFilter.selector.buyerId = user.userId;
		_blockchainGet(methodName, purchasesFilter, function(purchasesError, purchases) {
			if (purchasesError) {
				cb(purchasesError);
			}
			let balance = user.openingBalance;
			const addSales = (accumulator, currentValue) => accumulator + currentValue.Record.price;
			const subractPurchases = (accumulator, currentValue) => accumulator - currentValue.Record.price;
			if (Array.isArray(JSON.parse(sales))) {
				balance = JSON.parse(sales).reduce(addSales, balance);
			}
			if (Array.isArray(JSON.parse(purchases))) {
				balance = JSON.parse(purchases).reduce(subractPurchases, balance);
			} 
			cb(null, balance);
		});
	});
}

function _checkFundsAndPurchase(user, requestData, cb) {
	const sMethodName = "purchaseProduct";
	_calculateBalance(user, function(calcError, balance) {
    	if (calcError) {
    		cb(calcError);
    	} else {
			_blockchainGet("getProductOfferingById", requestData.product_id, function(getError, product) {
		    	if (getError) {
		    		cb(getError);
		    	} else {
		    		if (balance < JSON.parse(product).price) {
		    			cb("InsufficientFunds");
		    		} else {
						_blockchainPost(sMethodName, requestData, cb);
		    		}
		    	}
			});
    	}
	});
}

function getUserList(req, cb) {
	const userList = _getUsers();
	cb(null, JSON.stringify(userList));
}

function getProductOfferings(req, cb) {
	const methodName = "getProductOfferings";
    let filter = url.parse(req.url).query;
    if (!filter) {
    	filter = {"selector":{"docType":"productOfferings"}};
    }
	_blockchainGet(methodName, filter, cb);
}

function getAvailableProductOfferings(req, cb) {
	const methodName = "getProductOfferings";
    const filter = {"selector":{"docType":"productOfferings", "status": 1}};
	_blockchainGet(methodName, filter, cb);
}

function getProductOfferingsForUser(req, cb) {
	const methodName = "getProductOfferings";
    const filter = {"selector":{"docType":"productOfferings"}};
    _validateUserId(null, req, function(error, user) {
    	if (error) {
    		cb(error);
    	} else {
    		filter.selector.offerorId = user.userId;
			_blockchainGet(methodName, filter, cb);
    	}
    });
}

function getProductPurchasesForUser(req, cb) {
	const methodName = "getProductOfferings";
    const filter = {"selector":{"docType":"productOfferings"}};
    _validateUserId(null, req, function(error, user) {
    	if (error) {
    		cb(error);
    	} else {
	    	filter.selector.buyerId = user.userId;
			_blockchainGet(methodName, filter, cb);
    	}
    });
}

function getSoldProductsForUser(req, cb) {
	const methodName = "getProductOfferings";
    const filter = {"selector":{"docType":"productOfferings", "status": 2}};
    _validateUserId(null, req, function(error, user) {
    	if (error) {
    		cb(error);
    	} else {
	    	filter.selector.offerorId = user.userId;
			_blockchainGet(methodName, filter, cb);
    	}
    });
}

function getAccountBalance(req, cb) {
    _validateUserId(null, req, function(error, user) {
    	if (error) {
    		cb(error);
    	} else {
	    	_calculateBalance(user, function(calcError, balance) {
	    		if (calcError) {
	    			cb(calcError); 
	    		} else {
	    			cb(null, balance.toString());
	    		}
	    	});
    	}
    });
}

function registerProductOffering(req, cb) {
	const sMethodName = "registerProductOffering";
	let body = "";
    req.on("data", chunk => {
        body += chunk.toString(); // convert Buffer to string
    });
    req.on("end", () => {
    	body = JSON.parse(body);
    	body.userId = body.offeror_id;
		_blockchainPost(sMethodName, body, cb);
    });
}
function purchaseProduct(req, cb) {
	let requestData = "";
    req.on("data", chunk => {
        requestData += chunk.toString(); // convert Buffer to string
    });
    req.on("end", () => {
    	requestData = JSON.parse(requestData);
    	_validateUserId(requestData.buyer_id, req, function(error, user){
	    	if (error) {
	    		cb(error);
	    	} else {
	    		_checkFundsAndPurchase(user, requestData, cb);
	    	}
    	});
    });
}

function start(req, cb) {
    cb(null, "Energy Marketplace is available.");
}

exports.start = start;
exports.registerProductOffering = registerProductOffering;
exports.purchaseProduct = purchaseProduct;
exports.getProductOfferings = getProductOfferings;
exports.getAvailableProductOfferings = getAvailableProductOfferings;
exports.getProductOfferingsForUser = getProductOfferingsForUser;
exports.getProductPurchasesForUser = getProductPurchasesForUser;
exports.getSoldProductsForUser = getSoldProductsForUser;
exports.getAccountBalance = getAccountBalance;
=======
/*eslint no-console: 0*/
const request = require("request");
const url = require("url");
const querystring = require("querystring");
const fs = require("fs");

const cfenv = require("cfenv");
const uaaService = cfenv.getAppEnv().getService("uaa_service");
const destinationService = cfenv.getAppEnv().getService("destination_service");
const destinationName = "hyperledger-fabric";
const uaaCredentials = `${destinationService.credentials.clientid}:${destinationService.credentials.clientsecret}`;
const uaaOptions = {
    url: uaaService.credentials.url + "/oauth/token",
    method: "POST",
    headers: {
        "Authorization": "Basic " + Buffer.from(uaaCredentials).toString("base64"),
        "Content-type": "application/x-www-form-urlencoded"
    },
    form: {
        "client_id": destinationService.credentials.clientid,
        "grant_type": "client_credentials"
    }
};	

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

function _authenticateRequest(cb) {
	request(uaaOptions, (uaaError, res, data) => {
	    if (res.statusCode === 200) {
	        const uaaToken = JSON.parse(data).access_token;
	        const destinationOptions = {
	            url: `${destinationService.credentials.uri}/destination-configuration/v1/destinations/${destinationName}`,
	            headers: {
	                "Authorization": "Bearer " + uaaToken
	            }
	        };
	        request(destinationOptions, (error, result, destinationData) => {
			    if (result.statusCode === 200) {
		            const oDestination = JSON.parse(destinationData);
		            const token = oDestination.authTokens[0];
		            const headers = {
			            "Accept": "application/json",
	        	        "Authorization": `${token.type} ${token.value}`
		            };
					cb(null, headers, oDestination.destinationConfiguration.URL);
				} else {
			    	cb(error);
				}
	        });
	    } else {
	    	cb(uaaError);
	    }
	});
}
function _blockchainGet(methodName, arg, cb) {
	const destinationPath = `${methodName}/${typeof arg === "string" ? arg : JSON.stringify(arg)}`;
	_authenticateRequest(function(authError, headers, destinationURL) {
		if (authError) {
			cb(authError);
		}
        request.get({
            headers: headers,
            url: destinationURL + destinationPath
        }, function(error, response, body) {
            if (error) {
				cb(error);
            } else {
				cb(null, body);
            }
	    });
    });
}
function _blockchainPost(methodName, formData, cb) {
	const destinationPath = methodName;
	_authenticateRequest(function(authError, headers, destinationURL) {
        if (authError) {
            cb(authError);
        }
        headers["Content-Type"] = "multipart/form-data" ;
        request.post({
            headers: headers,
            url: destinationURL + destinationPath,
            form: formData
        }, function(error, response, body) {
            if (error) {
                cb(error);
            } else {
                cb(null, body);
            }
        });
    });
}

function _calculateBalance(user, cb) {
	const methodName = "getProductOfferings";
    const salesFilter = {"selector":{"docType":"productOfferings", "status": 2}};
	salesFilter.selector.offerorId = user.userId;
	_blockchainGet(methodName, salesFilter, function(salesError, sales) {
		if (salesError) {
			cb(salesError);
		}
	    const purchasesFilter = {"selector":{"docType":"productOfferings"}};
       	purchasesFilter.selector.buyerId = user.userId;
		_blockchainGet(methodName, purchasesFilter, function(purchasesError, purchases) {
			if (purchasesError) {
				cb(purchasesError);
			}
			let balance = user.openingBalance;
			const addSales = (accumulator, currentValue) => accumulator + currentValue.Record.price;
			const subractPurchases = (accumulator, currentValue) => accumulator - currentValue.Record.price;
			if (Array.isArray(JSON.parse(sales))) {
				balance = JSON.parse(sales).reduce(addSales, balance);
			}
			if (Array.isArray(JSON.parse(purchases))) {
				balance = JSON.parse(purchases).reduce(subractPurchases, balance);
			} 
			cb(null, balance);
		});
	});
}

function _checkFundsAndPurchase(user, requestData, cb) {
	const sMethodName = "purchaseProduct";
	_calculateBalance(user, function(calcError, balance) {
    	if (calcError) {
    		cb(calcError);
    	} else {
			_blockchainGet("getProductOfferingById", requestData.product_id, function(getError, product) {
		    	if (getError) {
		    		cb(getError);
		    	} else {
		    		if (balance < JSON.parse(product).price) {
		    			cb("InsufficientFunds");
		    		} else {
						_blockchainPost(sMethodName, requestData, cb);
		    		}
		    	}
			});
    	}
	});
}

function getUserList(req, cb) {
	const userList = _getUsers();
	cb(null, JSON.stringify(userList));
}

function getProductOfferings(req, cb) {
	const methodName = "getProductOfferings";
    let filter = url.parse(req.url).query;
    if (!filter) {
    	filter = {"selector":{"docType":"productOfferings"}};
    }
	_blockchainGet(methodName, filter, cb);
}

function getAvailableProductOfferings(req, cb) {
	const methodName = "getProductOfferings";
    const filter = {"selector":{"docType":"productOfferings", "status": 1}};
	_blockchainGet(methodName, filter, cb);
}

function getProductOfferingsForUser(req, cb) {
	const methodName = "getProductOfferings";
    const filter = {"selector":{"docType":"productOfferings"}};
    _validateUserId(null, req, function(error, user) {
    	if (error) {
    		cb(error);
    	} else {
    		filter.selector.offerorId = user.userId;
			_blockchainGet(methodName, filter, cb);
    	}
    });
}

function getProductPurchasesForUser(req, cb) {
	const methodName = "getProductOfferings";
    const filter = {"selector":{"docType":"productOfferings"}};
    _validateUserId(null, req, function(error, user) {
    	if (error) {
    		cb(error);
    	} else {
	    	filter.selector.buyerId = user.userId;
			_blockchainGet(methodName, filter, cb);
    	}
    });
}

function getSoldProductsForUser(req, cb) {
	const methodName = "getProductOfferings";
    const filter = {"selector":{"docType":"productOfferings", "status": 2}};
    _validateUserId(null, req, function(error, user) {
    	if (error) {
    		cb(error);
    	} else {
	    	filter.selector.offerorId = user.userId;
			_blockchainGet(methodName, filter, cb);
    	}
    });
}

function getAccountBalance(req, cb) {
    _validateUserId(null, req, function(error, user) {
    	if (error) {
    		cb(error);
    	} else {
	    	_calculateBalance(user, function(calcError, balance) {
	    		if (calcError) {
	    			cb(calcError); 
	    		} else {
	    			cb(null, balance.toString());
	    		}
	    	});
    	}
    });
}

function registerProductOffering(req, cb) {
	const sMethodName = "registerProductOffering";
	let body = "";
    req.on("data", chunk => {
        body += chunk.toString(); // convert Buffer to string
    });
    req.on("end", () => {
    	body = JSON.parse(body);
    	body.userId = body.offeror_id;
		_blockchainPost(sMethodName, body, cb);
    });
}
function purchaseProduct(req, cb) {
	let requestData = "";
    req.on("data", chunk => {
        requestData += chunk.toString(); // convert Buffer to string
    });
    req.on("end", () => {
    	requestData = JSON.parse(requestData);
    	_validateUserId(requestData.buyer_id, req, function(error, user){
	    	if (error) {
	    		cb(error);
	    	} else {
	    		_checkFundsAndPurchase(user, requestData, cb);
	    	}
    	});
    });
}

function start(req, cb) {
    cb(null, "Energy Marketplace is available.");
}

exports.start = start;
exports.registerProductOffering = registerProductOffering;
exports.purchaseProduct = purchaseProduct;
exports.getProductOfferings = getProductOfferings;
exports.getAvailableProductOfferings = getAvailableProductOfferings;
exports.getProductOfferingsForUser = getProductOfferingsForUser;
exports.getProductPurchasesForUser = getProductPurchasesForUser;
exports.getSoldProductsForUser = getSoldProductsForUser;
exports.getAccountBalance = getAccountBalance;
exports.getUserList = getUserList;
