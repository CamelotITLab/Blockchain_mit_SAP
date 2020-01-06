# PhoneDirectory
[![Hyperledger-Fabric-basiertes Phonedirectory](https://i.ibb.co/Ld1yCZ0/https-i-ytimg-com-vi-4-U-t5osf5e-Y-maxresdefault.jpg)](https://www.youtube.com/watch?v=4U_t5osf5eY "Hyperledger-Fabric-basiertes Phonedirectory")
Dieses erste einfache Projekt setzt ein einfaches Telefonbuch um. Es besteht aus zwei Bestandteilen: 
1) dem *chaincode* zur Installation in der Blockchain
2) dem *frontend* zur Installation in der SAP Web IDE
Bei diesem Beispielprojekt gibt es keine Middleware. Das Frontend kommuniziert direkt mit dem Chaincode in der Blockchain.
## Installation
### Chaincode
Die Versionsnummer in der Datei ```chaincode.yaml``` muss angepasst und der Quellcode des Chaincodes in ein ZIP-Archiv gepackt werden. Das so erstellte ZIP-Archiv wird in den Channel der Hyperledger-Fabric-Blockchain hochgeladen und dort zur Aktivierung instanziiert. In Kapitel 6 sowie im Anhang des Buches finden sich weiterführende Informationen. 
### Frontend
Das Web-Frontend muss in die SAP Web IDE entweder als ZIP-Archiv hochgeladen oder als Github-URL direkt importiert werden. Von dort aus kann es ausgeführt und deployt werden. 
Das Frontend hat eine zentrale Datei namens ```neo-app.json```, in der die Konfiguration des Projekts festgelegt wird. Darin ist definiert, wie das Frontend die Blockchain erreichen kann. Zur Vereinfachung wird dies mit dem symbolischen Namen "hyperledger-fabric" gelöst, der für die benötigte Destination gleichen Namens steht. 
### Einrichtung einer Destination zur Kommunikation mit der Blockchain
Nach der Installation des Chaincodes und des Frontends muss eine Destination eingerichtet werden - ein Endpunkt, über den das Frontend mit der Blockchain sprechen kann. Dazu benötigt das Frontend Sicherheits-Credentials, um sich gegenüber der Blockchain als berechtigt auszuweisen. Die Destination muss den Namen **hyperledger-fabric** tragen, damit das Frontend sie zur Adressierung von Anfragen an die Blockchain nutzen kann. 
![Konfiguration der Destination](https://github.com/CamelotITLab/Blockchain_mit_SAP/blob/master/Kapitel_6/Hyperledger_Fabric/phonedirectory/_destination-konfiguration.png)

