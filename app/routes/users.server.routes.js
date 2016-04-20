var users = require('../../app/controllers/users.server.controller'),
    login = require('../../app/controllers/login.server.controller');

module.exports = function (app) {
    app.route('/api/users')
        .get(login.isAuthenticated, login.hasUserControl, users.getUsersList)
        .post(login.isAuthenticated, login.hasUserControl, users.createUsers)
        .put(login.isAuthenticated, users.updateUsers)
        .delete(login.isAuthenticated, login.hasUserControl, users.deleteUsers);
    app.route('/api/users/checkField').post(login.isAuthenticated, login.hasUserControl, users.checkField)
};