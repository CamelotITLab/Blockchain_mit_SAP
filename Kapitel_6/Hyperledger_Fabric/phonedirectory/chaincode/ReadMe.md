# Installation des Chaincodes 
Der Chaincode befindet sich im Verzeichnis [src](https://github.com/CamelotITLab/Blockchain_mit_SAP/tree/master/Kapitel_6/Hyperledger_Fabric/phonedirectory/chaincode/src).
Die dazugehörige Datei [chaincode.yaml](https://github.com/CamelotITLab/Blockchain_mit_SAP/tree/master/Kapitel_6/Hyperledger_Fabric/phonedirectory/chaincode/chaincode.yaml) beschreibt den Namensraum und die Versionsnummer in der Form:
```
Id:       com-camelot-baas-phone-directory
Version:  0.1
```
Das Verzeichnis "src" und die Datei "chaincode.yaml" müssen in ein ZIP-Archiv gepackt werden. 
Die Beispieldatei [phonedirectory-chaincode.zip](https://github.com/CamelotITLab/Blockchain_mit_SAP/blob/master/Kapitel_6/Hyperledger_Fabric/phonedirectory/chaincode/phonedirectory_chaincode.zip) zeigt die Struktur des ZIP-Archivs, das in den Channel der Hyperledger-Fabric-Blockchain hochgeladen und installiert werden kann. Nach erfolgreicher Installation des Chaincodes muss dieser auch in der Blockchain instanziiert werden.

