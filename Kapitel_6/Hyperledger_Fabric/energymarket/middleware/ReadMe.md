# Node.js-Middleware
Dies ist die Node.js-basierte Middleware zur Kommunikation mit dem Front- und Backend, d.h. zwischen der Hyperledger-Fabric-Blockchain und dem zugehörigen Chaincode. 
Die Kommunikation mit dem **Frontend** wird über die Einrichtung einer Destination namens **"middleware"** sichergestellt, die das Frontend bei seinen Anfragen aufruft. 
Die Kommunikation mit dem Blockchain-**Backend** wird ebenfalls über eine Destination realisiert, die den Namen **"hyperledger-fabric"** trägt und in der Datei [requestHandlers.js](https://github.com/CamelotITLab/Blockchain_mit_SAP/blob/master/Kapitel_6/Hyperledger_Fabric/energymarket/middleware/requestHandlers.js) definiert ist. 
Auszug aus dem Kopfteil der Datei "requestHandlers.js":
```
...
const destinationService = cfenv.getAppEnv().getService("destination_service");
const destinationName = "hyperledger-fabric";
const uaaCredentials = `${destinationService.credentials.clientid}:${destinationService.credentials.clientsecret}`;
...
```
## Funktion
Die Aufgabe der Node.js-Middleware ist es, dem Frontend mögliche Aufrufe bereitzustellen. 
Aus der Datei [index.js](https://github.com/CamelotITLab/Blockchain_mit_SAP/blob/master/Kapitel_6/Hyperledger_Fabric/energymarket/middleware/index.js):
```
...
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
...
```

