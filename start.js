//Modules pour charger le fichier passé en argument, le parser et récupérer les fonctions
var fs = require('fs');
var esprima = require('esprima');
var estraverse = require('estraverse');
var escodegen = require("escodegen");

var prefix_fct = "instrument_";
var prefix_file = "monitored_";

//Le script d'instrumentation qu'on lancera à la fin
var instrument_script = "instrument_node.js";


//ON VÉRIFIE QUE L'APPLICATION A ÉTÉ SPÉCIFIÉE
if(typeof process.argv[2] == "undefined"){
	console.error("Spécifiez l'emplacement de l'application");
	return;
}


console.log("//     PARSING DE L'APPLICATION    \\\\");
console.log("//---------------------------------\\\\");

console.log("//Chargement du fichier " + process.argv[2] + "...");

//CHARGER LE FICHIER/L'APPLICATION
var filepath = process.argv[2];
var application = fs.readFileSync(filepath);

//SI LE FICHIER A BIEN ÉTÉ CHARGÉ (LE SCRIPT S'EST DÉROULÉ JUSQU'ICI)
//ON RÉCUPÈRE LE NOM DU FICHIER (ex : /usr/share/server.js ==> server.js)
var filename = filepath.split("/");
filename = filename[filename.length -1];


//ON RÉCUPÈRE LE FICHIER SOUS FORME DE JSON ESPRIMA
console.log("//Parsing du fichier avec Esprima...");
var ast = esprima.parse(application);


//ON PRÉPARE L'EXPORT DES FONCTIONS
console.log("//Préparation du fichier de test " + prefix_file + filename + "...");
var new_file_data = '\n' + "module.exports = { " + '\n' ;

//Nombre de fonctions exportées
var nb = 0;



//MODIFIER LE NOM DE CHAQUE APPEL DE FONCTION
console.log("//Listing des fonctions à instrumenter...");
estraverse.traverse(ast, {
    enter: function (node, parent) {
    	//Si le noeud est un appel de fonction on l'ajoute au module.exports
        if (node.type == 'CallExpression'){
        	if(typeof node.callee.name != "undefined" && node.callee.name != "require" && node.callee.name != "express"){

        		if(nb > 0){
        			new_file_data = new_file_data + ',';
        		}

        		nb++;
        		new_file_data = new_file_data + '\n' + prefix_fct + node.callee.name + " : " + node.callee.name;
        		node.callee.name = "module.exports." + prefix_fct + node.callee.name;
            }
        }
    }
});


//ON FINI LA CHAINE QUI CORRESPONDRA AUX EXPORTS DES FONCTIONS
//new_file_data :
/*
  module.exports = {
	instrument_f1 : f1,
	...
	instrument_fn : fn
  };
*/
new_file_data = new_file_data + '\n' + "};";


//ON CONCATÈNE LE CODE MODIFIÉ AVEC L'EXPORT DES FONCTIONS
new_file_data = escodegen.generate(ast) + new_file_data;


//ON ÉCRIT LE NOUVEAU FICHIER
var dir = "./monitored_apps";
var fname = prefix_file + filename;

console.log("//Écriture du fichier " + dir + "/" + fname + " ...");

write_it(dir, fname, new_file_data);


function write_it(dir, fname, data){
	//Si le répertoire n'existe pas on le crée
	fs.exists(dir, function(exists){
			if(!exists){
				mkdir(dir, fname, data);
			} else {
				write_file(dir + '/' + fname, data);
			}
	});
}


function mkdir(dir, fname, data){
	fs.mkdir(dir, function(err){
		if (err) throw err;
		console.log("//Répertoire " + dir + " créé.");

		//Une fois que le répertoire est créé on s'occupe du fichier
		write_file(dir + '/' + fname, data);
	});
}

function write_file(fname, data){
	fs.writeFile(fname, data, function(err){
		if (err) throw err;
		console.log("//Fichier " + fname + " créé.");

		//Une fois que le fichier est créé on lance le process d'instrumentation
		launch(instrument_script, fname);
	});
}

//Lancement de l'instrumentation
function launch(instrument_script, app_name){

	console.log("//Lancement du script " + instrument_script + " pour instrumenter " + app_name + " ...");

	var exec = require('child_process').exec, child;
	console.log("//Instrumentation en cours...");
	child = exec('node ' + instrument_script + " " + app_name,
	  function (error, stdout, stderr) {
	    if (error !== null) {
	      console.log('exec error: ' + error);
	    }
	});
}


