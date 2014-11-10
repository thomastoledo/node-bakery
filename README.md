node-bakery
===========

### [ENGLISH]

An open-source project for monitoring node.js applications.

This project came out from a necessity : monitor in a proper and clear way Node.js appplications. Many tools are available, but this one is open-source and base on a non code intrusion principle.


#### Working

The process of this tool can be summed up by the following schema.

![Fonctionnement de l'outil node-bakery](http://i1.wp.com/www.bytesbakery.com/wp-content/uploads/2014/11/moduleExportNodeJS.png?w=1170).

The *start.js* script must be launched via the ```node start.js application.js``` command where ```application.js``` is the application to monitor. The *start.js* script will then parse *application.js* to retrieve all the functions to monitor and will create a *monitored_application.js* file which will be executed instead of *application.js* : it is because we need to modify the code but we do not want to do it manually and we do not want to be intrusive, so we create a altered clone.<br/>

The *start.js* script will then launch the *instrument_node.js* script which will :
- launch the *monitor.js* script allowing us to get system metrics ;
- launch the *monitored_application.js* application to monitor its functions.


#### Communication and integration
**node-bakery** sends metrics via *HTTP*. To edit where to send it, you need to edit the *instrulent_node.js* and *monitor.js* script as shown below. This tool can be integrated with any interface which may receive and interpret **GET** requests.


```
var server = "adresse du serveur";
```
*monitor.js*


```
//Envoi de la métrique "concurrent invocations"
function sendConcurrentInvocations(map){
	var req = "mon serveur";
	...
}
```
*instrument_node.js*

#### Dependencies
In order to work, this solution requires some Node.js modules : 
```
//La variable AOP qui permet de monitorer les fonctions
var meld = require("meld");

//Pour effectuer des requêtes HTTP
var request = require("request");
```

```
//Pour lancer les notifications en parralèle
var async = require('async');

//Pour les métriques système
var Monitor = require('monitor');
```

```
//Modules pour charger le fichier passé en argument, le parser et récupérer les fonctions
var fs = require('fs');
var esprima = require('esprima');
var estraverse = require('estraverse');
var escodegen = require("escodegen");
```

And so : 

```
npm install meld request async monitor fs esprima estracerse escodegen
```


#### Improvements / Next steps
- more correct monitoring of asynchronous transactions with a **local thread** ;
- recursivity. A Node.js application basically works with many files : **node-bakery** should be able to re-create those files too ;
- improvement of the communication protocol (HTTP can become heavy).


### [FRANÇAIS]

Un projet open-source pour monitorer des applications node.js.

Ce projet provient d'un besoin : monitorer proprement et clairement des applications node.js. Plusieurs outils existent mais celui-ci se veut être open-source et est basé sur le principe de non-intrusion de code.


#### Fonctionnement

Le fonctionnement de l'outil peut se résumer par le schéma suivant.
![Fonctionnement de l'outil node-bakery](http://i1.wp.com/www.bytesbakery.com/wp-content/uploads/2014/11/moduleExportNodeJS.png?w=1170).

Le script *start.js* doit être lancé via la commande ```node start.js application.js``` où ```application.js``` est l'application à monitorer. Le script *start.js* va parser *application.js* pour récupérer les fonctions à monitorer et va recréer un fichier *monitored_application.js* qui sera exécuté à la place de l'application : c'est parce que le code a besoin d'être modifié et qu'on ne veut pas le faire de manière manuelle et directement dans l'application.<br/>

Le script *start.js* va ensuite lancer le script *instrument_node.js* qui va : 
- lancer le script *monitor.js* permettant d'avoir des métriques système ;
- lancer l'application *monitored_application.js* pour monitorer ses fonctions.


#### Communication et intégration
**node-bakery** envoie les métriques via *HTTP*. Pour configurer l'endroit où les envoyer, il faut modifier les scripts *instrument_node.js* et *monitor.js* comme montré ci-dessous. Cet outil s'intègre donc avec n'importe quelle interface recevant et interprétant des requêtes **GET**.

```
var server = "adresse du serveur";
```
*monitor.js*


```
//Envoi de la métrique "concurrent invocations"
function sendConcurrentInvocations(map){
	var req = "mon serveur";
	...
}
```
*instrument_node.js*

#### Dépendances
Pour que cette solution fonctionne, les modules Node.js suivants sont requis : 
```
//La variable AOP qui permet de monitorer les fonctions
var meld = require("meld");

//Pour effectuer des requêtes HTTP
var request = require("request");
```

```
//Pour lancer les notifications en parralèle
var async = require('async');

//Pour les métriques système
var Monitor = require('monitor');
```

```
//Modules pour charger le fichier passé en argument, le parser et récupérer les fonctions
var fs = require('fs');
var esprima = require('esprima');
var estraverse = require('estraverse');
var escodegen = require("escodegen");
```

Et donc : 

```
npm install meld request async monitor fs esprima estracerse escodegen
```


#### Améliorations / Next steps
- monitoring de toute la chaîne d'une transaction asynchrone par un **thread local** ;
- récursivité. Une application Node.js peut-être séparée en plusieurs modules : il faut pouvoir aussi les récréer, pour le moment **node-bakery** ne s'occupe que du fichier passé en argument ;
- amélioration du protocole de communication (HTTP peut vite surcharger le réseau) et du format des messages.


