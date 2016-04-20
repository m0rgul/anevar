(function () {
    var app = angular.module('usersApp', ['ngTable', 'ngResource', 'ngRoute', 'ui.bootstrap', 'ngMaterial', 'ngMessages']);

    app.controller('usersCtrl', usersCtrl);
    usersCtrl.$inject = ["$scope", "NgTableParams", "usersService", "$uibModal"];

    function usersCtrl($scope, NgTableParams, usersService, $uibModal) {
        $scope.roles =
            [
                {
                    id: '0',
                    title: "Nu"
                },
                {
                    id: '1',
                    title: "Da"
                }
            ];

        function getRoles() {
            return $scope.roles;
        }

        $scope.cols = [
            {field: "id", title: "Index", filter: {id: "number"}, show: false},
            {field: "fullName", title: "Numele Complet", filter: {fullName: "text"}, sortable: "fullName", show: true},
            {field: "username", title: "Nume Utilizator", filter: {username: "text"}, sortable: "username", show: true},
            {field: "email", title: "Email Utilizator", filter: {email: "text"}, show: true},
            {
                field: "userControl",
                title: "Acces Management Utilizatori?",
                filter: {userControl: "select"},
                filterData: getRoles,
                show: true
            },
            {
                field: "contractControl",
                title: "Acces Management Contracte?",
                filter: {contractControl: "select"},
                filterData: getRoles,
                show: true
            }
        ];

        $scope.tableParams = new NgTableParams({
            page: 1,
            count: 10
        }, {
            counts: [10, 20, 25, 50],
            getData: function (params) {
                return usersService.query({
                    page: params.page(),
                    perPage: params.count(),
                    filters: params.filter(),
                    sort: params.sorting()
                }).$promise.then(
                    function (data) {
                        var totalItems = parseInt(data.total);
                        var items = [];
                        angular.forEach(data.records, function (item) {
                            var newItem = {
                                id: item.id,
                                fullName: item.fullName,
                                username: item.username,
                                email: item.email,
                                userControl: item.userControl == 1 ? 'Da' : 'Nu',
                                contractControl: item.contractControl == 1 ? 'Da' : 'Nu'
                            };
                            items.push(newItem);
                        });
                        params.total(totalItems);
                        return items;
                    },
                    function (error) {
                        if (error.status == 403) {
                            alert('Sesiune expirata, necesita re-autentificare.');
                            window.location.href = '/';
                            return [];
                        } else {
                            alert('Error: ' + error.status + ', ' + error.statusText);
                        }
                    });
            }
        });

        $scope.newUserPU = function newUserPU() {
            $scope.openModal(null);
        };

        $scope.openModal = function openModal(item) {

            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'users.html',
                controller: 'userCrudController',
                backdrop: false,
                size: 'lg',
                resolve: {
                    user: function () {
                        if (item) {
                            item.edit = true;
                            return item;
                        } else return {
                            edit: false
                        }
                    }
                }
            });

            modalInstance.result.then(function (result) {
                $scope.result = result;
                $scope.tableParams.reload();

                console.log(result);
                if ($scope.result.newName)
                    jQuery('#fullName').html(result.newName);
            });
        };
    }

    app.controller('userCrudController', userCrudController);
    userCrudController.$inject = ["$scope", "$uibModalInstance", "user", "$http", "$mdDialog"];

    function userCrudController($scope, $uibModalInstance, user, $http, $mdDialog) {
        $scope.usernameRegex = /^[a-zA-Z0-9]{4,15}$/;
        $scope.fullNameRegex = /^[a-zA-Z][0-9a-zA-Z .,'-]*$/;

        $scope.trySubmit = false;
        $scope.isSaving = false;

        $scope.user = {
            id: user.id ? user.id : '',
            username: user.username ? user.username : "",
            fullName: user.fullName ? user.fullName : "",
            email: user.email ? user.email : "",
            userControl: user.userControl == 'Da',
            contractControl: user.contractControl == 'Da',
            edit: user.edit
        };

        if ($scope.user.edit)
            $scope.user.action = 'Editare informatii utilizator';
        else
            $scope.user.action = 'Adaugare utilizator';

        $scope.ok = function () {
            if (!$scope.userForm.$valid) {
                $scope.trySubmit = true;
                return false;
            }

            $scope.isSaving = true;

            var user = {
                id: $scope.user.id ? $scope.user.id : '',
                fullName: $scope.user.fullName,
                username: $scope.user.username,
                email: $scope.user.email,
                userControl: $scope.user.userControl,
                contractControl: $scope.user.contractControl
            };

            createUpdateUser(user, function (error, response) {
                if (error) {
                    $scope.isSaving = false;
                    if (error.status == 403) {
                        alert('Sesiune expirata, necesita re-autentificare.');
                        window.location.href = '/';
                    } else {
                        alert('Error: ' + error.status + ', ' + error.statusText);
                    }
                    $scope.result = error;
                    return false;
                } else {
                    $uibModalInstance.close(response);
                }
            });
        };

        $scope.delete = function (ev) {
            var confirm = $mdDialog.confirm()
                .title('Stergere utilizator?')
                .textContent('Va rugam sa confirmati operatiunea de stergere.')
                .targetEvent(ev)
                .ok('Stergere')
                .cancel('Anulare');

            $mdDialog.show(confirm).then(function () {
                if ($scope.user.id == '' || $scope.user.id == undefined || $scope.user.id == 0)
                    return;
                deleteUser($scope.user, function (error, response) {
                    if (error) {
                        if (error.status == 403) {
                            alert('Sesiune expirata, necesita re-autentificare.');
                            window.location.href = '/';
                        } else {
                            alert('Error: ' + error.status + ', ' + error.statusText);
                        }
                        $scope.result = error;
                        return false;
                    } else {
                        $scope.result = response.msg;
                        $uibModalInstance.close($scope.result);
                    }
                });
            }, function () {
                return false;
            });
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };

        var createUpdateUser = function createUpdateUser(user, callback) {
            var method = $scope.user.edit ? 'PUT' : 'POST';
            $http({
                method: method,
                url: '/api/users',
                data: angular.toJson(user)
            }).then(
                function successCallback(response) {
                    if (response && response.data.success) {
                        callback(null, response.data);
                    } else {
                        callback(response.data.msg);
                    }
                }, function errorCallback(error) {
                    callback(error);
                });
        };

        var deleteUser = function deleteUser(user, callback) {
            $http({
                method: 'DELETE',
                url: '/api/users',
                data: angular.toJson({'id': user.id}),
                headers: {'Content-Type': 'application/json;charset=utf-8'}
            }).then(
                function successCallback(response) {
                    if (response && response.data.success) {
                        callback(null, response.data);
                    } else {
                        callback(response.data.msg);
                    }
                }, function errorCallback(error) {
                    callback(error);
                });
        };

        $scope.$watch('user.username', function (newValue) {
            if (newValue && newValue != '' && newValue.length >= 6 && !$scope.user.edit) {
                var field = {username: newValue};
                isFieldValid(field, function (err, res) {
                    if (err) {
                        return;
                    }
                    if (res) {
                        $scope.userForm.username.$setValidity('unique', true);
                    }
                    else {
                        $scope.userForm.username.$setValidity('unique', false);
                    }
                });
            } else
                $scope.userForm.username.$setValidity('unique', true);
        }, true);

        $scope.$watch('user.email', function (newValue) {
            if (newValue && newValue.length > 0 && (!$scope.user.edit || $scope.user.email != user.email)) {
                var field = {email: newValue};
                isFieldValid(field, function (err, res) {
                    if (err) {
                        $scope.userForm.email.$setValidity('unique', false);
                        return;
                    }
                    if (res) {
                        $scope.userForm.email.$setValidity('unique', true);
                    }
                    else {
                        $scope.userForm.email.$setValidity('unique', false);
                    }
                });
            }
        }, true);

        var isFieldValid = function isFieldValid(field, callback) {
            $http.post('/api/users/checkField', field)
                .success(function (data) {
                    if (data)
                        callback(null, true);
                    else
                        callback(null, false);
                })
                .error(function (error) {
                    callback(error);
                });
        };
    }

    app.factory("usersService", ["$resource", function ($resource) {
        return $resource("/api/users", {}, {
            query: {
                method: "GET",
                isArray: false
            }
        });
    }]);
})();