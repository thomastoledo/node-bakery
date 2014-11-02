
/*
* Nous allons lancer ce script via le script "instrument_node.js"
* Nous devons donc l'exporter en plaçant tout le code dans une seule
* et unique fonction
*/
module.exports = {
 launch : function(){

    //Pour lancer les notifications en parralèle
    var async = require('async');

    //Pour communiquer via HTTP les métriques
    var request = require("request");

    //Pour les métriques système
    var Monitor = require('monitor');

    var server = "adresse du serveur";

    //Nous spécifions les options des probes qui seront déployés
    var options = {
      probeClass: 'Process',
      initParams: {
        pollInterval: 5000
      }
    }

    var processMonitor = new Monitor(options);


    //À chaque changement, on déclenche plusieurs opérations
    processMonitor.on('change', function() {
      var OperatingSystem = processMonitor.get('platform');
      async.parallel([
        //Monitoring de l'uptime
        function(){
          var uptime = processMonitor.get('uptime');
          var req = "l'adresse du serveur";
          sendRequest(server, ...);
        },

        //Monitoring memory usage du process
        function(){
          async.parallel([

            //rss
            function(){
              sendRequest(server, "GET",
               server + "|rss", processMonitor.get('rss'),);
            },
            //vsize
            function(){
              sendRequest(server, "GET",
               server + "|vsize", processMonitor.get('vsize'));
            },

            //heap total
            function(){
              sendRequest(server, "GET",
               server + "|totalHeap", processMonitor.get('heap%20total')/8);
            },
            //heap used
            function(){
              sendRequest(server, "GET",
               server + "|usedHeap", processMonitor.get('heap%20used')/8);
            },
            //heap free
            function(){
              sendRequest(server, "GET",
               server + "|heap%20free", (processMonitor.get('heapTotal') - processMonitor.get('heapUsed'))/8);
            }

          ]);
        },

        //Monitoring OS metrics
        function(){
          async.parallel([
            //Load AVG
            function(){
              sendRequest(server, "GET", server + "|load%20avg%20(/min)",  processMonitor.get('loadavg')[0]);
              sendRequest(server, "GET", server + "|load%20avg%20(/5%20min)",  processMonitor.get('loadavg')[1]);
              sendRequest(server, "GET", server + "|load%20avg%20(/15%20min)",  processMonitor.get('loadavg')[2]);
            },

            //OS Uptime
            function(){
              sendRequest(server, "GET", server + "|OS%20uptime", processMonitor.get('osUptime'));
            },

            //Free memory
            function(){
              sendRequest(server, "GET", server + "|free%20memory", (processMonitor.get('freemem')/8));
            },

            //Total memory
            function(){
              sendRequest(server, "GET", server + "|total%20memory", (processMonitor.get('totalmem')/8));
            },
            
            //Memory used
            function(){
              sendRequest(server, "GET", server + "|used%20memory", (processMonitor.get('totalmem') - processMonitor.get('freemem'))/8);
            },

            //CPUs
            function(){
              var i;
              var cpu;
              for(i=0; i<processMonitor.get('cpus').length; i++){
                cpu = processMonitor.get('cpus')[i];
                
                sendRequest(server, "GET", server + "|CPU%20" + i + "|util%20time", ((cpu.times.sys + cpu.times.user)/100000));
            
              }
            }
          ]);
        }

      ]);

    });

    //Activation du monitor
    processMonitor.connect(function(error) {
      if (error) {
        process.exit(1);
      }
    });

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
  }
}