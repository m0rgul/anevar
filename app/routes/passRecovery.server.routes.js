var passRecover = require('../../app/controllers/passRecovery.server.controller');

module.exports = function (app) {
    app.route('/forgot').get(passRecover.render);
    app.route('/recoveryToken').post(passRecover.generateRecoveryToken);
    app.route('/reset/:token')
        .get(passRecover.recoverPassword)
        .post(passRecover.resetPassword);
};