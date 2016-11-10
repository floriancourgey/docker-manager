(function(){
  'use strict';

  const {shell} = require('electron');
  const exec = require('child_process').exec;
  const spawn = require('child_process').spawn;

  angular
    .module('app')
    .controller('containerController', ['containerService', '$interval', '$timeout', '$q', ContainerController])
    .filter('nomContainer', function() {
      return function(input) {
        input = input || '';
        var regex = /^\/./;
        if(!input.match(regex)){
          return input;
        }
        return input.substring(1);
      };
    })
  ;

  function ContainerController(containerService, $interval, $timeout, $q) {
    var self = this;

    /**
     * contient tous les containers
     * ATTENTION cette liste est regénérée, donc ne rien stocker dedans
     */
    self.containers = [];

    /**
     * contient les child process lancés via self.start()
     * (l'index est l'id du container)
     */
    self.process = [];

    /**
     * contient les stdout de chaque container
     * (l'index est l'id du container)
     */
    self.stdout = [];

    self.rafraichir = function(){
      containerService.getContainersId().then(function(ids){
        let promises = [];
        ids.forEach(function(id){
          promises.push(containerService.getContainer(id));
        });
        $q.all(promises).then((containers) => {
          // on fait l'update seulement si les données ont changé
          // pour cela on compare les json string de container.NetworkSettings
          var oldJsonString = '';
          self.containers.forEach(function(container){
            oldJsonString += JSON.stringify(container.NetworkSettings);
          });
          var newJsonString = '';
          containers.forEach(function(container){
            newJsonString += JSON.stringify(container.NetworkSettings);
          });
          if(oldJsonString != newJsonString){
            console.log("changement détecté, rafraichissement");
            self.containers = containers;
          }
        });
      });
    }

    self.rafraichir();
    // $timeout(function(){
    //   self.rafraichir();
    // }, 1000);
    $interval(function(){
      self.rafraichir();
    }, 2000);

    /**
     * Démarre le container
     * `docker start -i`
     */
    self.start = function(container){
      container.Chargement = "démarrage";
      self.process[container.Id] = spawn("docker", ['start', '-i', container.Id], { detached: true });
      console.log("self.process[container.Id]", self.process[container.Id]);
      self.process[container.Id].stdout.on('data', function(data) {
        if(!(container.Id in self.stdout)){
          self.stdout[container.Id] = [];
        }
        self.stdout[container.Id].push(data.toString());
        // scroll tout en bas
        var $element = $("#stdout-"+container.Id)[0];
        // console.log($element);
        $element.scrollTop = $element.scrollHeight;
        // fin chargement
        container.Chargement = false;
      });
    };

    /**
     * Arrête le container
     * `docker stop`
     */
    self.stop = function(container){
      container.Chargement = "arrêt";
      var process = self.process[container.Id];
      var commande = 'docker stop '+container.Name;
      exec(commande);
      process.kill();
      process.on('exit', function () {
        container.Chargement = false;
      });
    }

    self.log = function(objet){
      console.log(objet);
    }

    self.ouvrirInternet = function(container){
      console.log('ouvrir internet');
      var url = 'http://'+container.NetworkSettings.IPAddress;
      var port = self.getPort(container);
      if(port != null)
        url += ':'+port;
      console.log('ouverture de '+url);
      shell.openExternal(url);
    }

    self.supprimer = function(container){
      var commande = "docker rm "+container.Id;
      exec(commande);
    }

    self.getPort = function(container){
      if(!container.State.Running){
        return null;
      }
      // retourne un tableau de port
      var ports = container.NetworkSettings.Ports;
      // ici on récupère le premier
      // de la forme {numéro_port}/{protocole}
      // ex "80/tcp"
      var port = Object.keys(ports)[0];
      // on extrait les nombres
      var regex = /^\d+/;
      var resultats = regex.exec(port);
      if(resultats.length <= 0){
        return null;
      }
      return resultats[0];
    }

    self.ouvrirMount = function(mount){
      var path = mount.Source;
      console.log('ouverture mount '+path);
      shell.showItemInFolder(path);
    }
  }
})();
