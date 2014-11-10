//La variable AOP qui permet de monitorer les fonctions
var meld = require("meld");

//Pour effectuer des requêtes HTTP
var request = require("request");

//Pour inclure le monitoring des ressources système
var monitor = require('./monitor.js');

//Une Map qui va contenir les attributs précisés dans les commentaires ci-dessous
var fonctions = new Object();

var prefix = "instrument_";

/*
* Lancer le serveur dans un contexte d'instrumentation
* On récupère en même temps les fonctions qui auront été au préalable parsées
* et exportées par le script start.js
*/
var instrumentation = require('./' + process.argv[2]);


/*
console.log("//     INITIALISATION DE LA MAP    \\\\");
console.log("//---------------------------------\\\\");

console.log("//Map pour les fonctions. Chaque case contient : ");
console.log("//<Key = name_fct, Value = Object()>");
console.log("//Object ==> aroundAOP, afterReturningAOP, afterThrowingAOP, nbTrans, executions = Object");
*/

fillMap(fonctions, instrumentation);
/*
console.log("INITIALISATION : OK");
console.log("LANCEMENT DU MONITORING SYSTEM");
*/
//Lancement du monitoring système
monitor.launch()
/*console.log("SCRIPT RUNNING...");
console.log("");
*/
//Fonction pour remplir les maps
function fillMap(map, instrumentation){
	Object.keys(instrumentation).sort(function( a, b ) {
    	return a.localeCompare( b );
	}).forEach(function( element, index, array ) {
		//Chaque entrée est un objet
    	map[element] = new Object();

    	//Chaque objet contient une liste d'executions <ID ; {begin, done, intervalStall}>
    	map[element].executions = new Object();

    	//Ainsi qu'un nombre de transactions en cours pour la fonction considérée
    	map[element].nbTrans = 0;

    	//Application de l'AOP sur la fonction
    	map[element].removerAround = meld.around(instrumentation, element, aroundAOP);
    	map[element].removerAfterReturning = meld.afterReturning(instrumentation, element, afterReturningAOP);
    	map[element].removerAfterThrowing = meld.afterThrowing(instrumentation, element, afterThrowingAOP);
	});
}


//Advice AROUND pour les fonctions monitorées
function aroundAOP(){
	//On récupère le jointpoint
	var joinPoint = meld.joinpoint();
	//On récupère le nom de la fonction
	var fctName = joinPoint.method;

	//On crée un ID pour la nouvelle execution
	var executionId = Math.random().toString(36).substr(2) + (new Date().getTime());
	fonctions[fctName].executions[executionId] = new Object();



	//On renseigne la date de début de l'execution
	fonctions[fctName].executions[executionId].begin =  new Date().getTime();

	//On augmente le nombre de concurrents
	//On set un timer périodique pour que toutes les 30 secondes il incrémente le nombre de stallCounts
	fonctions[fctName].executions[executionId].stallCount = setInterval(function(){sendStallCount(fonctions, fctName);},30000);

	//Le nombre d'executions pour cette fonction a augmenté
	fonctions[fctName].nbTrans++;

	//Lancement de la fonction
	joinPoint.proceed();

	//Le nombre de transactions à diminué
	fonctions[fctName].nbTrans--;

	fonctions[fctName].executions[executionId].done =  new Date().getTime();

	//Calcul du temps d'exécution
	fonctions[fctName].executions[executionId].timetot = fonctions[fctName].executions[executionId].done
														 - fonctions[fctName].executions[executionId].begin;

	//On supprime l'execution des concurrent invocations
	deleteTimer(fonctions[fctName].executions, executionId);
	
	//Envoi de l'avg resp time et du througput
	sendAvgRespTime(fonctions, fctName, executionId);

	//On supprime la transaction de la liste
	delete fonctions[fctName].executions[executionId];
}


//Advice AfterReturning
function afterReturningAOP(){
	//On récupère le jointpoint
	var joinPoint = meld.joinpoint();

	//On récupère le nom de la fonction
	var fctName = joinPoint.method;

	//On envoie le throughput
	sendThroughput(fctName);
}

//Advice AfterThrowing
function afterThrowingAOP(){
	//On récupère le jointpoint
	var joinPoint = meld.joinpoint();

	//On récupère le nom de la fonction
	var fctName = joinPoint.method;

	//On envoie l'error
	sendError(fctName);
}


//L'intervalle de triggering pour les concurrent invocations 
setInterval(function(){
	//envoi des concurrents invocations
	//et mise à jour des compteurs
	sendConcurrentInvocations(fonctions);
},15000);


//Supprimer un timer (exécution de la fonction finie)
function deleteTimer(map, id_timer){
	clearInterval(map[id_timer].stallCount);
}


//Envoi de la métrique "stall count"
function sendStallCount(map, fctName){
	var req = "mon serveur";
	sendRequest(req, "GET", "Functions|" + fctName.substring(prefix.length, fctName.length) + ":Stall%20Count", 1);
}

//Envoi de la métrique "concurrent invocations"
function sendConcurrentInvocations(map){
	var req = "mon serveur";
	Object.keys(map).sort(function( a, b ) {
    	return a.localeCompare( b );
	}).forEach(function( element, index, array ) {
    	sendRequest(req, "GET", "Functions|" + element.substring(prefix.length, element.length) + ":Concurrent%20Invocations", map[element].nbTrans);
	});
}

//Envoi de l'avg response time
function sendAvgRespTime(map, fctName, executionId){
	var req = "mon serveur";
	sendRequest(req, "GET", "Functions|" + fctName.substring(prefix.length, fctName.length) + ":Average%20Response%20Time%20(ms)",
		 map[fctName].executions[executionId].timetot);
}

//Envoi du throughput
function sendThroughput(fctName){
	var req = "mon serveur";
	sendRequest(req, "GET", "Functions|" + fctName.substring(prefix.length, fctName.length) + ":Responses%20Per%20Interval",
		 1);
}

//Envoi de l'error
function sendError(fctName){
	var req = "mon serveur";
	sendRequest(req, "GET", "Functions|" + fctName.substring(prefix.length, fctName.length) + ":Errors%20Per%20Interval",
		 1);
}

//Envoi d'une requête HTTP (ici uniquement en GET)
function sendRequest(url, method_, metricName, metricValue){
  //À décommenter si l'outil qui reçoit vos métriques ne traite que les entiers
  //metricValue = Math.round(metricValue);
  url = url + "?&metricName=" + metricName + "&metricValue=" + metricValue;
  request({
    uri: url,
    method: method_,
    }, function(error, response, body) {
  });
}
