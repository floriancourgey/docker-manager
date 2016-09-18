(function(){
  'use strict';

  const exec = require('child_process').exec;

  angular.module('app')
        .service('containerService', ['$q', ContainerService]);

  function ContainerService($q) {
    return {
        getContainersId: getContainersId,
        getContainer: getContainer
    };
    function getContainersId() {
      var deferred = $q.defer();
      var containers = [];
      ///
      exec('docker ps -a', (error, stdout, stderr) => {
        if (error) {
          deferred.reject(error);
          return;
        }
        // console.log(`stdout: ${stdout}`);
        var lignes = stdout.split("\n");
        // on zappe la premère ligne (header) et la dernière (vide)
        lignes = lignes.slice(1,-1);
        // lignes = lignes.slice(0,4);
        // console.log(lignes);
        // pour chaque id, on `docker inspect`
        for(var i in lignes){
          var ligne = lignes[i];
          var id = ligne.split(" ")[0];
          containers.push(id);
        }
        deferred.resolve(containers);
      });
      ///
      return deferred.promise;
    }

    function getContainer(id){
      var deferred = $q.defer();
      var container = {id:id};
      exec('docker inspect '+id, (error, stdout, stderr) => {
        if (error) {
          deferred.reject(error);
          return;
        }
        container = angular.fromJson(stdout)[0];
        deferred.resolve(container);
      });
      return deferred.promise;
    }
  }
})();
