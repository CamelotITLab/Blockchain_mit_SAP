var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers");

var handle = {};
handle["/"] = requestHandlers.start;
handle["/registerProductOffering"] = requestHandlers.registerProductOffering;
handle["/purchaseProduct"] = requestHandlers.purchaseProduct;
handle["/getProductOfferings"] = requestHandlers.getProductOfferings;
handle["/getAvailableProductOfferings"] = requestHandlers.getAvailableProductOfferings;
handle["/getProductOfferingsForUser"] = requestHandlers.getProductOfferingsForUser;
handle["/getProductPurchasesForUser"] = requestHandlers.getProductPurchasesForUser;
handle["/getSoldProductsForUser"] = requestHandlers.getSoldProductsForUser;
handle["/getAccountBalance"] = requestHandlers.getAccountBalance;
handle["/getUserList"] = requestHandlers.getUserList;
handle["/getUserList"] = requestHandlers.getUserList;

server.start(router.route, handle);