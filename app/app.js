(function () {
    'use strict';

    var _templateBase = '.';

    angular.module('app', [
        'ngRoute',
        'ngAnimate'
    ])
    .config(['$routeProvider', function ($routeProvider) {
            $routeProvider.when('/', {
                templateUrl: _templateBase + '/container/container.html' ,
                controller: 'containerController',
                controllerAs: '_ctrl'
            });
            $routeProvider.otherwise({ redirectTo: '/' });
        }
    ]);

})();
