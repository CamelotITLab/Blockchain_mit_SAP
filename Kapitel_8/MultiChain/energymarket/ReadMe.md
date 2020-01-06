# EnergyMarket
Dies ist das Beispielprojekt für einen dezentralen Energiemarktplatz auf Basis der MultiChain. 
[![MultiChain-basierter dezentraler Energiemarktplatz](https://i.ibb.co/wMKLV2h/https-i-ytimg-com-vi-TQWYV7-Qmy88-maxresdefault.jpg)](https://youtu.be/TQWYV7Qmy88 "MultiChain-basierter dezentraler Energiemarktplatz")
Es setzt sich aus drei Bestandteilen zusammen: 
- einem **Frontend**-Projekt
- einer **Middleware**, die die Business-Logik enthält und ausführt 
- einem MultiChain-basierten **Backend**
***Hinweis***
*Das Verzeichnis "backend" enthält keinen Quellcode, da MultiChain 1.0 aufgrund fehlender Programmiermöglichkeiten keine Smart Contracts unterstützt. Das Verzeichnis dient nur zur Orientierung innerhalb der Projektstruktur.*
## Installation
### Installation des Frontends
Das Frontend-Projekt muss in die SAP Web IDE geladen und dort deployt werden. Das Projekt benötigt eine Destination namens **"middleware"**, über die die Node.js-Middleware erreicht werden kann. 
#### Verbindung zwischen Frontend und Middleware
Das Frontend kommuniziert mit der Middleware mittels einer einzurichtenden Destination namens **"middleware"**.
Aus der Projektdatei [neo-app.json](https://github.com/CamelotITLab/Blockchain_mit_SAP/blob/master/Kapitel_8/MultiChain/energymarket/frontend/neo-app.json) des Frontend-Projektes:
```
{
  "welcomeFile": "/webapp/index.html",
  "routes": [
    {
      "path": "/resources",
      "target": {
        "type": "service",
        "name": "sapui5",
        "entryPath": "/resources"
      },
      "description": "SAPUI5 Resources"
    },
    {
      "path": "/test-resources",
      "target": {
        "type": "service",
        "name": "sapui5",
        "entryPath": "/test-resources"
      },
      "description": "SAPUI5 Test Resources"
    },
    {
      "path": "/middleware",
      "target": {
        "type": "destination",
        "name": "middleware"
      },
      "description": "Energy Market Middleware API"
    }
  ],
  "sendWelcomeFileRedirect": true
}
```
### Installation der Middleware
Die Middleware muss als eigenes Projekt installiert und angepasst werden. 
#### Verbindung zwischen Middleware und Backend
Die Middleware kommuniziert mit dem Blockchain-Backend über einen im Quellcode eingetragenen API-Key (in der SAP Cloud Platform auch Service Key genannt) und ruft die MultiChain-URL für RPC-Aufrufe auf, um mit der Blockchain zu kommunizieren und Daten zu speichern oder abzurufen. 
Beide Angaben (API-Key und MultiChain-RPC-URL) erhält man über die Seite zur Einrichtung des Service Keys über einen Knoten der MultiChain. Ein neuer Schlüssel sollte dort erstellt werden: 
![ServiceKey und URL](https://github.com/CamelotITLab/Blockchain_mit_SAP/blob/master/Kapitel_8/MultiChain/energymarket/_serviceKey-MultiChain.PNG)
Beide Angaben (api_key und url) zum neuen Service Key müssen in der Datei [requestHandlers.js](https://github.com/CamelotITLab/Blockchain_mit_SAP/blob/master/Kapitel_8/MultiChain/energymarket/middleware/requestHandlers.js)) eingetragen werden:
```
/*eslint no-console: 0*/
const request = require("request");
const url = require("url");
const querystring = require("querystring");
const fs = require("fs");
const apikey = "EIGENEN_API_KEY_HIER_EINTRAGEN";
const multichainurl = "EIGENE_URL_ZUM_RPC_AUFRUF_HIER_EINTRAGEN";
const streamName = "EnergyMarket";
const assetName = "EnergyCoin";
...
```
Anschließend kann das Projekt gestartet und/oder deployt werden. 

