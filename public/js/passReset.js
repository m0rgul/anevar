/**
 * Created by LV7 on 2/3/2016.
 */
var app = angular.module('passReset', ['ngMessages']);

(function () {
    app.controller('passResetCtrl', function ($scope, $http) {
        $scope.user = {};
        $scope.passRegex = /(?=^.{8,}$)(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s)[0-9a-zA-Z!@#$%^&*()]*$/;

        $scope.$watchGroup(['password', 'password2'], function (newValues) {
          if (newValues[0] != '' && newValues[1] != '') {
                $scope.passRecoveryForm.password2.$setValidity('match', newValues[0] === newValues[1]);
            }
        }, true);

        $scope.resetPassword = function () {
            var url = window.location.href;
            $http.post(url, {password: forge_sha256($scope.password)})
                .success(function (data) {
                    if (data.success) {
                        window.location.href = "/";
                    }
                    else
                        alert(data.msg);
                })
                .error(function (err) {
                    console.log(err);
                });
        };
    });
})();