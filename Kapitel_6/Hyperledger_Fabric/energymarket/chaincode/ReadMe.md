# Installation des Chaincodes
Dies ist der Chaincode, d.h. die Programmierung für die Hyperledger-Fabric-Blockchain zur Steuerung der Datenabfrage und -sicherung für den Energiemarktplatz. Der eigentliche Chaincode ist im Verzeichnis "src" zu finden, die Datei chaincode.yaml gibt den Namespace und die Versionsnummer an:
```
Id:       com-camelot-energy-market
Version:  0.16
```
Zur Installation des Chaincodes muss der Inhalt dieses Verzeichnisses als ZIP-Archiv gepackt, in den Channel auf einem der Peer-Knoten der Hyperledger-Fabric-Blockchain hochgeladen und instanziiert werden. 
