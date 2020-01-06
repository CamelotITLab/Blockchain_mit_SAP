# EnergyMarket

[![Hyperledger Fabric-basierter dezentralisierter Energiemarkt](https://i.ibb.co/QQtHCwx/https-i-ytimg-com-vi-VZDpd-S78-4-E-maxresdefault.jpg)](https://youtu.be/VZDpdS78_4E "Hyperledger Fabric-basierter dezentralisierter Energiemarkt")

Dies sind die Dateien für das EnergyMarket-Beispiel auf Basis von Hyperledger Fabric.

Es setzt sich aus den folgenden Bestandteilen zusammen:

- Programmierung für die Hyperledger-Fabric-Blockchain in Form von **Chaincode**
- Node.js-basierte **Middleware** zur Kommunikation zwischen Frontend und Backend (der Blockchain)
- SAPUI5-basiertes **Frontend** zur Darstellung im Webbrowser

## Installation
Jeder der drei Bestandteile ist ein separates Projekt und muss individuell installiert werden: 
1) Der *chaincode* muss in die Blockchain hochgeladen und aktiviert werden.
2) Die *middleware* muss als Node.js--Projekt gestartet werden.
3) Das *frontend* muss auf die Middleware zugreifen können, um mit der Blockchain zu kommunizieren.

Danach müssen Middleware und Blockchain mit einer Destination miteinander verbunden werden. Ebenso müssen Frontend und Middleware auf diese Weise verbunden werden.


### Installation des Chaincodes
Der Chaincode muss als ZIP-Archiv in die Blockchain geladen und aktiviert werden.

### Installation der Middleware
Die Middleware muss als Node.js-Projekt gestartet werden. 

### Installation des Frontends
Das SAPUI5-Frontend muss auf der SAP Cloud Platform in einem separaten Subspace mit NEO-Umgebung gestartet werden. 

## Einrichtung einer Destination: Frontend zu Middleware
Das Frontend nutzt in seinen Aufrufen einen symbolischen Namen **"middleware"** zur Kommunikation mit der Middleware.
![Destination Configuration](https://github.com/CamelotITLab/Blockchain_mit_SAP/blob/master/Kapitel_6/Hyperledger_Fabric/energymarket/_destination-konfiguration.png "Konfiguration der Destination für die Middleware")

Immer wenn das Frontend eine URL mit dem Pfadbestandteil /middleware aufruft, wird die Destination genutzt. Der Einfachheit halber wurde auf die Authentifizierung verzichtet ("Authentication: NoAuthentication"). **Eine Nutzung der Middleware ohne Authentifizierung stellt im produktiven Betrieb ein Sicherheitsproblem dar und sollte vermieden werden. Die Middleware ist sonst frei aufrufbar.** 

## Einrichtung einer Destination: Middleware zum Blockchain-Backend
Nach der Installation des Chaincodes und des Frontends muss eine Destination auf der SAP Cloud Platform eingerichtet werden, die den Namen **hyperledger-fabric** trägt, damit die Middleware weiß, wohin sie ihre Aufrufe an die Blockchain absetzen kann. 
![Konfiguration der Destination](https://github.com/CamelotITLab/Blockchain_mit_SAP/blob/master/Kapitel_6/Hyperledger_Fabric/phonedirectory/_destination-konfiguration.png)
