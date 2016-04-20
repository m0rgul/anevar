(function () {
    var app = angular.module('contractsApp', ['ngTable', 'ngResource', 'ngRoute', 'ui.bootstrap', 'ngMaterial', 'ngMessages']);

    app.controller('contractsCtrl', contractsCtrl);
    contractsCtrl.$inject = ["$scope", "NgTableParams", "contractsService", "$uibModal"];

    function contractsCtrl($scope, NgTableParams, contractsService, $uibModal) {
        var now = new Date();
        now.setHours(0, 0, 0, 0);
        $scope.tableParams = new NgTableParams({
            page: 1,
            count: 10
        }, {
            counts: [10, 20, 25, 50],
            getData: function (params) {
                return contractsService.query({
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
                                contractNo: item.contract_no,
                                contractDate: item.contract_date,
                                provider: item.provider,
                                beneficiary: item.beneficiary,
                                contractObj: item.contract_object,
                                addendum: item.last_addendum,
                                expDate: item.expiration_date,
                                canRenew: item.can_renew,
                                contractVal: item.contract_value,
                                contractRent: item.contract_rent,
                                utilities: item.utilities,
                                otherExpenses: item.other_expenses,
                                comments: item.comments,
                                user: item.user_id,
                                daysLeft: getDaysLeft(new Date(item.expiration_date))
                            };
                            console.log(newItem.daysLeft);
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


        $scope.renewOptions = [
            {id: '1', title: "Da"},
            {id: '0', title: "Nu"}
        ];

        $scope.newContractPU = function newContractPU() {
            $scope.openModal(null);
        };

        var size = '';
        if (typeof modalSize != 'undefined' && modalSize != '')
            size = modalSize;
        else
            size = 'lg';

        $scope.openModal = function openModal(item) {
            var modalInstance = $uibModal.open({
                animation: true,
                templateUrl: 'contracts.html',
                controller: 'contractsCrudController',
                backdrop: false,
                size: size,
                resolve: {
                    contract: function () {
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
            });
        };

        var getDaysLeft = function getDaysLeft(targetDate) {
            var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
            return Math.round((targetDate.getTime() - now.getTime()) / (oneDay));
        };
    }

    app.controller('contractsCrudController', contractsCrudController);
    contractsCrudController.$inject = ["$scope", "$uibModalInstance", "contract", "$http", "$mdDialog"];
    function contractsCrudController($scope, $uibModalInstance, contract, $http, $mdDialog) {
        $scope.renewOptions = [
            {id: 0, title: "Nu"},
            {id: 1, title: "Da"}
        ];

        $scope.altInputFormats = ['M!/d!/yyyy'];

        $scope.openDate1 = function () {
            $scope.datePopup1.opened = true;
        };

        $scope.openDate2 = function () {
            $scope.datePopup2.opened = true;
        };

        $scope.datePopup1 = {
            opened: false
        };

        $scope.datePopup2 = {
            opened: false
        };

        $scope.dateOptions = {
            'clear-text': 'Golire',
            'close-text': 'Inchide',
            'current-text': 'Azi',
            startingDay: 1
        };

        $scope.trySubmit = false;
        $scope.isSaving = false;

        $scope.contract = {
            id: contract.id ? contract.id : '',
            contractNo: contract.contractNo ? contract.contractNo : "",
            contractDate: contract.contractDate ? new Date(contract.contractDate) : "",
            provider: contract.provider ? contract.provider : "",
            beneficiary: contract.beneficiary ? contract.beneficiary : '',
            contractObj: contract.contractObj ? contract.contractObj : '',
            addendum: contract.addendum ? contract.addendum : '',
            expDate: contract.expDate ? new Date(contract.expDate) : '',
            canRenew: $scope.renewOptions[contract.canRenew],
            contractVal: contract.contractVal ? contract.contractVal : 0,
            contractRent: contract.contractRent ? contract.contractRent : 0,
            utilities: contract.utilities ? contract.utilities : 0,
            otherExpenses: contract.otherExpenses ? contract.otherExpenses : 0,
            comments: contract.comments,
            user: contract.user ? contract.user : 0,
            edit: contract.edit
        };

        if ($scope.contract.edit)
            $scope.contract.action = 'Editare informatii contract';
        else
            $scope.contract.action = 'Adaugare contract';

        $scope.ok = function () {
            if (!$scope.contractForm.$valid) {
                $scope.trySubmit = true;
                return false;
            }

            $scope.isSaving = true;

            var contract = {
                id: $scope.contract.id ? $scope.contract.id : '',
                contract_no: $scope.contract.contractNo,
                contract_date: $scope.contract.contractDate,
                provider: $scope.contract.provider,
                beneficiary: $scope.contract.beneficiary,
                contract_object: $scope.contract.contractObj,
                last_addendum: $scope.contract.addendum,
                expiration_date: $scope.contract.expDate,
                can_renew: $scope.contract.canRenew.id,
                contract_value: $scope.contract.contractVal,
                contract_rent: $scope.contract.contractRent,
                utilities: $scope.contract.utilities,
                other_expenses: $scope.contract.otherExpenses,
                comments: $scope.contract.comments
            };

            createUpdateContract(contract, function (error, response) {
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
                    $uibModalInstance.close($scope.result);
                }
            });
        };

        $scope.delete = function (ev) {
            var confirm = $mdDialog.confirm()
                .title('Stergere contract?')
                .textContent('Va rugam sa confirmati operatiunea de stergere.')
                .targetEvent(ev)
                .ok('Stergere')
                .cancel('Anulare');

            $mdDialog.show(confirm).then(function () {
                deleteContract($scope.contract, function (error, response) {
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

        var createUpdateContract = function createUpdateContract(contract, callback) {
            $http({
                method: 'POST',
                url: '/api/contracts',
                data: angular.toJson(contract)
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

        var deleteContract = function deleteContract(contract, callback) {
            $http({
                method: 'DELETE',
                url: '/api/contracts',
                data: angular.toJson({'id': contract.id}),
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

    }

    app.factory("contractsService", ["$resource", function ($resource) {
        return $resource("/api/contracts", {}, {
            query: {
                method: "GET",
                isArray: false
            }
        });
    }]);

    app.filter('daNu', function () {
        return function (input) {
            return input == 1 ? 'Da' : 'Nu';
        }
    });
})();