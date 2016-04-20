(function () {
    var app = angular.module('forgotPass', ['ngMessages']);

    app.controller('forgotPassCtrl', function ($scope, $http) {
        $scope.user = {};
        $scope.email = {
            sending: false
        };
        $scope.resetOk = false;

        $scope.submitRegister = function () {
            if ($scope.passRecoveryForm.email.$invalid) {
                $scope.passRecoveryForm.email.$setValidity('email', false);
                return;
            }

            var user = {
                email: $scope.user.email
            };

            $http.post('/recoveryToken', user)
                .success(function (data) {
                    if (data.success) {
                        $scope.email.success = true;
                        $scope.email.text = 'S-a trimis un mail cu link-ul de resetare a parolei la adresa specificata.';
                        $scope.resetOk = true;
                    } else {
                        $scope.email.success = false;
                        $scope.email.text = data.msg;
                        $scope.email.sending = false;
                    }
                })
                .error(function (err) {
                    $scope.email.success = false;
                    $scope.email.text = err;
                    $scope.email.sending = false;
                });
        };
    });
})();