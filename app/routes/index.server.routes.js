var index = require('../../app/controllers/index.server.controller'),
    login = require('../../app/controllers/login.server.controller');

module.exports = function (app) {
    app.route('/')
        .get(index.renderLogin);
    app.get('/users', login.isAuthenticated, login.hasUserControl, index.renderUsers);
    app.get('/contracts', login.isAuthenticated, index.renderContracts);
    app.get('/settings', login.isAuthenticated, index.renderSettings);
};