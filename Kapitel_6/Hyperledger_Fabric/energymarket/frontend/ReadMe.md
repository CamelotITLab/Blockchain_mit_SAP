# Installation des Frontends
Dies ist das SAPUI5-basierte Frontend, über das der dezentrale Energiemarktplatz mit der Middleware kommuniziert, die wiederum mit der Blockchain kommuniziert. Damit das Frontend weiß, wie es die Middleware erreichen kann, muss ihm die Zieladresse zur Ansprache der Middleware in Form einer Destination mitgeteilt werden. Dazu wird eine Destination namens "middleware" definiert (Kleinschreibung beachten), die beim Aufrufen der Middleware als symbolische Konstante im Code des Frontends genutzt wird. 
Dies wird in der Projektdatei ```neo-app.json``` definiert:
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
Das Frontend-Projekt muss in die SAP Web IDE geladen und von dort ausgeführt bzw. deployt werden.
