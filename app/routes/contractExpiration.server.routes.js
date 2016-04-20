var contractExpiration = require('../../app/controllers/contractExpiration.server.controller');

module.exports = function (app) {
    app.route('/checkContracts')
        .get(contractExpiration.checkContracts);
};