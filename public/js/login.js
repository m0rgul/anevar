(function () {
    var app = angular.module('loginApp', []);
    app.controller('loginCtrl', loginCtrl);
    loginCtrl.$inject = ["$scope", "$http"];

    function loginCtrl($scope, $http) {
        $scope.user = {};

        $scope.trySubmit = false;
        $scope.isSaving = false;
        $scope.result = {
            message: '',
            success: false
        };

        $scope.login = function () {
            if ($scope.loginForm.$invalid) {
                $scope.trySubmit = true;
                return;
            }

            $scope.isSaving = true;
            $scope.result.message = '';

            var data = {
                username: $scope.user.username,
                password: forge_sha256($scope.user.password)
            };

            $http.post('/login', angular.toJson(data))
                .then(
                    function (response) {
                        $scope.result.success = response.status == 200;
                        $scope.result.message = response.data;

                        if ($scope.result.success) {
                            setTimeout(function () {
                                window.location.href = '/contracts';
                            }, 1000);
                        }
                        else {
                            $scope.isSaving = false
                        }

                    },
                    function (error) {
                        $scope.result.success = false;
                        $scope.result.message = error.data;
                        $scope.isSaving = false;
                    });
        };
    }
})();