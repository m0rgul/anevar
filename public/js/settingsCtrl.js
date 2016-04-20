(function () {
    var app = angular.module('settingsApp', ['ngMessages']);

    app.controller('settingsCtrl', settingsCtrl);
    settingsCtrl.$inject = ["$scope", "$http"];

    function settingsCtrl($scope, $http) {
        $scope.passRegex = /(?=^.{8,}$)(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s)[0-9a-zA-Z!@#$%^&*()]*$/;

        $scope.error = false;
        $scope.showAlert = false;
        $scope.message = '';
        $scope.sendingData = false;

        $scope.changePass = function () {
            $scope.sendingData = true;

            var data = {
                password: forge_sha256($scope.password),
                pChange: true
            };


            $http.put('/api/users', data).then(
                function successCallback(response) {
                    $scope.showAlert = true;
                    $scope.error = false;
                    $scope.message = 'Parola a fost schimbata cu succes.';
                    setTimeout(function () {
                        window.location.href = '/contracts';
                    }, 2000);
                }, function errorCallback(response) {
                    var status = response.status;
                    if (status == 403) {
                        $scope.showAlert = true;
                        $scope.error = true;
                        $scope.message = 'Sesiune expirata, necesita reautentificare.';
                        setTimeout(function () {
                            window.location.href = '/';
                        }, 2000);
                    }
                    else {
                        $scope.error = true;
                        $scope.message = 'Eroare: ' + response.status + ', ' + response.statusText;
                        $scope.showAlert = true;
                        $scope.sendingData = false;

                    }
                });
        };

        $scope.$watchGroup(['password', 'password2'], function (newValues, oldValues) {
            if (newValues[0] != '' && newValues[1] != '') {
                $scope.userAccountSettings.password2.$setValidity('match', newValues[0] === newValues[1]);
            }
        }, true);
    }
})();