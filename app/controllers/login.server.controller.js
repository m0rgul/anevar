var mysql = require('mysql');
var bcrypt = require('bcryptjs');

exports.login = function (req, res) {
    var connection = mysql.createConnection(mySqlConfig);
    var username = req.body.username;
    var password = req.body.password;

    var query = "SELECT * FROM `users` WHERE `username` = '" + username + "'";

    connection.query(query, function (err, response) {
        if (err)
            return res.status(500).send('Error: ' + JSON.stringify(err));

        if (response && response.length > 0) {
            var resp = response[0];
            var dbPass = resp.password;

            if (bcrypt.compareSync(password, dbPass)) {
                var user = {
                    id_admin: resp.id,
                    fullName: resp.fullName,
                    userControl: resp.userControl == 1,
                    contractControl: resp.contractControl == 1
                };
                req.session.user = user;
                connection.end();
                return res.status(200).send('Autentificare reusita.');
            } else {
                connection.end();
                return res.status(401).send('Nume utilizator sau parola gresite.');
            }

        } else {
            connection.end();
            return res.status(404).send('Nu am gasit utilizatorul.');
        }
    });
};

exports.logout = function (req, res) {
    req.session.destroy(function (err) {
        if (err)
            return next(err);

        res.redirect('/');
    });
};

// AUTHENTICATION VALIDATION MIDDLEWARE
exports.isAuthenticated = function (req, res, next) {
    var session = req.session;
    if (!session.user) {
        return res.sendStatus(403);
    }
    next();
};

exports.hasUserControl = function (req, res, next) {
    var user = req.session.user;
    if (!user.userControl)
        return res.sendStatus(403);
    next();
};

exports.hasContractControl = function (req, res, next) {
    var user = req.session.user;
    if (!user.contractControl)
        return res.sendStatus(403);
    next();
};