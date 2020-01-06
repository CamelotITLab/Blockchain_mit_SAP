# Pharma-Inventory
Einfaches Beispiel zur Speicherung von Schlüssel-Wert-Paaren mit MultiChain, demonstriert anhand eines Produktinventars für ein fiktives Pharmaunternehmen.
[![MultiChain-basiertes Pharma-Inventar](https://i.ibb.co/NrJb8VH/https-i-ytimg-com-vi-a-C-T7xgx-Sw0-maxresdefault.jpg)](https://www.youtube.com/embed/aC_T7xgxSw0 "MultiChain-basiertes Pharma-Inventar")
Das Projekt setzt sich aus zwei Bestandteilen zusammen:
- einem SAPUI5-**Frontend** (siehe Screenshot)
- dem **Backend** basierend auf MultiChain

***Hinweis***

*Da MultiChain in der Version 1.0 nicht programmiert werden kann und damit keine Unterstützung für Smart Contracts bietet, wird die MultiChain mithilfe einzelner RPC-Aufrufe eingerichtet. Das Verzeichnis "backend" enthält deswegen keinen Quellcode.*

## Installation
Das Frontend-SAPUI5-Projekt kommuniziert direkt im Betrieb mit der API der MultiChain und muss deswegen einen sogenannten API-Key zur Legitimierung erhalten. Den API-Key (auf der SAP Cloud Platform auch Service Key genannt) kann man durch einen der Knoten der MultiChain erstellen.
![Erzeugen eines API-Keys](https://github.com/CamelotITLab/Blockchain_mit_SAP/blob/master/Kapitel_8/MultiChain/pharma-inventory/apikey-and-url.png "Erzeugen eines API-Keys")
### Installation des Frontends
Das Frontend-Projekt muss in die SAP Web IDE geladen, und der API-Key zum Aufruf der MultiChain-API muss in der Datei [PharmaInventory.Controller.js](https://github.com/CamelotITLab/Blockchain_mit_SAP/blob/master/Kapitel_8/MultiChain/pharma-inventory/frontend/webapp/controller/PharmaInventory.controller.js) hinterlegt werden. 
Weiterhin geht die Programmierung davon aus, dass es einen Stream namens **"pharma-inventory"** in der MultiChain gibt, der zur Speicherung der Daten genutzt werden kann.
Auszug aus der Datei [PharmaInventory.Controller.js](https://github.com/CamelotITLab/Blockchain_mit_SAP/blob/master/Kapitel_8/MultiChain/pharma-inventory/frontend/webapp/controller/PharmaInventory.controller.js) (der selbsterzeugte apikey muss eingesetzt werden):
```
...
onInit: function () {
			this.url = "/multichain/rpc";
			this.apikey = "EIGENEN_API_KEY_HIER_EINSETZEN";
			this.stream = "pharma-inventory";
			this.init();
		},
...
```
![Setzen des API-Keys](https://github.com/CamelotITLab/Blockchain_mit_SAP/blob/master/Kapitel_8/MultiChain/pharma-inventory/set-apikey.png "API-Key setzen")
Das Projekt kann anschließend in der SAP Web IDE mit "build" gebaut und/oder deployt werden. 

