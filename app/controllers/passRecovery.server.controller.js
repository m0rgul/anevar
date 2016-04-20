var async = require('async'),
    mysql = require('mysql'),
    crypto = require('crypto'),
    dateFormat = require('dateformat'),
    bCrypt = require('bcryptjs'),
    nodemailer = require('nodemailer'),
    smtpTransport = require("nodemailer-smtp-transport");

exports.render = function (req, res) {
    var msg = '';
    if (req.query.err) {
        msg = 'Token expirat sau invalid. Va rugam sa reintroduceti adresa de e-mail pentru a primi un token nou.';
    }
    res.render('forgotPass', {msg: msg});
};

exports.generateRecoveryToken = function (req, res) {
    var connection = mysql.createConnection(mySqlConfig);

    var email = req.body.email;
    var db = 'users';

    async.waterfall(
        [
            generateToken = function (callback) {
                crypto.randomBytes(20, function (err, buf) {
                    if (err)
                        return callback(err);
                    var token = buf.toString('hex');
                    callback(null, token);
                });
            },
            getUserFromDB = function (token, callback) {
                var query = "SELECT * FROM ?? WHERE ?? = ?";
                var inserts = [db, 'email', email];
                query = mysql.format(query, inserts);
                connection.query(query, function (err, rows) {
                    if (err)
                        return callback(err);
                    if (rows && rows.length == 1) {
                        user = rows[0];
                        callback(null, token, user);
                    }
                    else
                        return callback({msg: "Email not found in data base."});
                });

            },
            writeTokenToDB = function (token, user, callback) {
                var tokenExpires = dateFormat(Date.now() + (4 * 3600 * 1000), "yyyy-mm-dd HH:MM:ss");
                var id = user.id;
                var query = "UPDATE ?? SET ? WHERE `id` = " + id;
                query = mysql.format(query, [db, {resetPasswordToken: token, resetPasswordExpires: tokenExpires}]);
                connection.query(query, function (err, result) {
                    if (err)
                        return callback(err);
                    if (result.affectedRows > 0)
                        callback(null, token, user);
                    else
                        return callback({msg: 'Something went wrong somewhere...over the rainbow...'});
                });
            },
            sendEmail = function (token, user, callback) {
            	var smtpTrans = nodemailer.createTransport(smtpTransport({
                    host: "s62.rohost.com",
                    secureConnection: true,
                    port: 465,
                    auth: {
                        user: "gestiunecontracte@anevar.ro",
                        pass: "TeS%h7tmCuZ9"
                    },
                    tls: {rejectUnauthorized: false}
                }));

                var link = 'http://' + req.headers.host + '/reset/' + token;
                var name = user.fullName.split(' ').length > 1 ? user.fullName.split(' ')[0] : user.fullName;

                var mailOptions = {
                    to: user.email,
                    from: 'gestiunecontracte@anevar.ro',
                    subject: 'Resetare Parola',
                    html: '<h2>Buna ziua, ' + name + '</h2><br/>' +
                    'Va trimitem acest email pentru ca dvs. (sau altcineva) a cerut resetarea parolei contului.<br/>' +
                    'Pentru resetare, va rugam sa accesati acest <a href="' + link + '">link</a>. Link-ul este valabil timp de 4 ore de la momentul cererii schimbarii de parola.<br/>' +
                    'Daca nu s-a cerut schimbarea parolei, ignorati acest email si parola va ramane neschimbata. <br/><br/>' +
                    'Anevar Gestiune Contracte'
                };

                smtpTrans.sendMail(mailOptions, function (err) {
                    if (err)
                        return callback(err);
                    callback(null, 'done');
                });

            }
        ],
        function (err) {
            connection.end();
            if (err)
                return res.json({success: false, msg: err.msg});

            return res.json({success: true, msg: 'Email sent.'});
        }
    );
};

exports.recoverPassword = function (req, res) {
    var token = req.params.token;
    var db = 'users';

    var connection = mysql.createConnection(mySqlConfig);

    var query = "SELECT * FROM `" + db + "` WHERE `resetPasswordToken` = '" + token + "' AND `resetPasswordExpires` > '" + dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss") + "'";

    connection.query(query, function (err, result) {
        if (err) {
            connection.end();
            return res.send(err);
        }
        if (result.length > 0) {
            connection.end();
            return res.render('passRecover');
        }
        else {
            connection.end();
            return res.redirect('/forgot?err=true');
        }
    });
};

exports.resetPassword = function (req, res) {
    var newPass = bCrypt.hashSync(req.body.password, 10);
    var token = req.params.token;
    var db = 'users';

    var connection = mysql.createConnection(mySqlConfig);

    async.waterfall([
        getUser = function (callback) {
            var query = "SELECT * FROM `" + db + "` WHERE `resetPasswordToken` = '" + token + "' AND `resetPasswordExpires` > '" + dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss") + "'";

            connection.query(query, function (err, result) {
                if (err)
                    return callback(err);
                if (result.length > 0) {
                    var user = result[0];
                    callback(null, user);
                }
                else
                    return callback({msg: 'Password reset token is invalid or has expired.'});
            });
        },
        updatePassword = function (user, callback) {
            var query = "UPDATE ?? SET ? WHERE `id` = ?";
            query = mysql.format(query, [db,
                {
                    resetPasswordToken: '',
                    resetPasswordExpires: '',
                    password: newPass
                },
                user.id
            ]);

            connection.query(query, function (err, result) {
                if (err)
                    return callback(err);
                if (result.affectedRows > 0)
                    callback(null, user);
                else
                    return callback({msg: 'Something went wrong somewhere...over the rainbow...'});
            });
        },
        sendEmail = function (user, callback) {
            var message = 'Hello,\n\n' +
                'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n';
            callback(null, message);
        }
    ], function (err, message) {
        connection.end();
        if (err)
            return res.json({success: false, msg: err});
        return res.json({success: true, msg: message});
    });
};



