var contracts = require('../../app/controllers/contracts.server.controller'),
    login = require('../../app/controllers/login.server.controller');

module.exports = function (app) {
    app.route('/api/contracts')
        .get(login.isAuthenticated, contracts.getContractsList)
        .post(login.isAuthenticated, login.hasContractControl, contracts.addUpdateContract)
        .delete(login.isAuthenticated, login.hasContractControl, contracts.removeContract);
};