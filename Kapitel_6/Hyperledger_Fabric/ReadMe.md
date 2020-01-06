# Kapitel 6: Blockchain-Anwendungen mit Hyperledger Fabric entwickeln
## Erstes Beispiel: PhoneDirectory
Ein einfaches Einstiegsbeispiel zur Entwicklung eines Telefon- oder Adressbuches, in dem Namen und Anschriften gespeichert werden. 
[![Hyperledger Fabric-basiertes PhoneDirectory ](https://i.ibb.co/qx30GpK/https-i-ytimg-com-vi-l-Ahi-V0-PZjv-Y-maxresdefault.jpg)](https://youtu.be/lAhiV0PZjvY "Hyperledger Fabric-basiertes PhoneDirectory ")
## Zweites Beispiel: EnergyMarket
Ein komplexeres Beispiel zur Entwicklung eines dezentralen Energiemarktplatzes, auf dem mehrere Anbieter Strompakete anbieten und kaufen können. 
[![Hyperledger Fabric-basierter dezentralisierter Energiemarkt](https://i.ibb.co/QQtHCwx/https-i-ytimg-com-vi-VZDpd-S78-4-E-maxresdefault.jpg)](https://youtu.be/VZDpdS78_4E "Hyperledger Fabric-basierter dezentralisierter Energiemarkt")
# Generelle Informationen zur Installation
Die hier im Quellcode zur Verfügung gestellten Projekte für Hyperledger Fabric bestehen entweder aus zwei oder aus drei Bestandteilen: 
- dem *Chaincode*, der in der Blockchain zu installieren ist
- der (bei manchen Beispielen optionalen) *Middleware*-Anwendung als Node.js-Projekt
- dem *Frontend*, basierend auf SAPUI5, als Web-App
## Schritt 1: Installation der einzelnen Projekte
### Installation des Chaincodes
Zur Installation des Chaincodes muss dessen Versionsnummer in der Datei '''chaincode.yaml''' angepasst werden. Anschließend müssen der Chaincode und die Datei in ein ZIP-Archiv überführt sowie über einen Peer-Knoten der Blockchain in den jeweiligen Channel hochgeladen und installiert werden. Weiterführende Informationen zu diesem Schritt finden sich im Anhang des Buches.
### Installation der Node.js-Middleware
Die Node.js-Middleware muss zunächst mittels "build" gebaut, dann ausgeführt und gegebenenfalls auch installiert oder deyployt werden.
### Installation des Frontend-Projekts
Die jeweiligen Frontend-Projekte sind als Web-Apps konzipiert und müssen in der SAP Web IDE gebaut und deployt werden.
## Schritt 2: Konfiguration der Kommunikation der Bestandteile
Nachdem alle Bestandteile eines der Beispiele installiert wurden, müssen sie miteinander verbunden werden, um eine funktionierende Gesamtlösung zu erhalten. Dies geschieht etwa durch die Einrichtung von Destinations auf der SAP Cloud Platform - definierten Endpunkten, über die sich authentifizierte Applikationen miteinander verbinden dürfen.
Mehr Informationen zur Installation und Ausführung finden Sie in den ReadMe-Dateien in den jeweiligen Projektordnern.
