var CRUD = require('../modules/mysql_crud.js'),
    bCrypt = require('bcryptjs'),
    forge = require('node-forge'),
    mysql = require('mysql'),
    nodemailer = require('nodemailer'),
    smtpTransport = require("nodemailer-smtp-transport"),
    async = require('async');
var fieldNames = ['fullName', 'username', 'email', 'password', 'userControl', 'contractControl'];

exports.getUsersList = function (req, res) {
    var tablecrud = new CRUD('users', fieldNames);
    var filters = req.query.filters ? JSON.parse(req.query.filters) : {};
    var sort = req.query.sort ? JSON.parse(req.query.sort) : {};
    var page = req.query.page ? parseInt(req.query.page) : 0;
    var perPage = req.query.perPage ? parseInt(req.query.perPage) : 0;

    tablecrud.getList(filters, sort, page, perPage, function (err, result) {
        if (err) {
            var errCode = err.code;
            switch (errCode) {
                case 1021:
                    res.status(400).send('An error has occured: Disk full; waiting for someone to free some space... .');
                    break;
                case 1022:
                    res.status(409).send('Duplicate entry');
                    break;
                default:
                    res.status(400).send('An error has occured.');
                    break;
            }
        } else {
            return res.json(result);
        }
    });
};

exports.createUsers = function (req, res) {
    var tablecrud = new CRUD('users', fieldNames);
    var user = req.body;

    if (user.password && user.password != '') {
        user.password = bCrypt.hashSync(user.password, 10);
    } else {
        user.unencryptedPassword = randomPassword();
        var md = forge.md.sha256.create();
        var encryptedPass = md.update(user.unencryptedPassword).digest().toHex();
        user.password = bCrypt.hashSync(encryptedPass, 10);
    }

    tablecrud.insertUpdateRecord(user, function (err, response) {
        if (err) {
            var errCode = err.code;
            switch (errCode) {
                case 1021:
                    res.status(500).send('An error has occured: Disk full; waiting for someone to free some space... .');
                    break;
                case 1022:
                    res.status(409).send('Duplicate entry');
                    break;
                default:
                    res.status(400).send('An error has occured.');
                    break;
            }
        }
        else {
            //send email
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

            var websiteUrl = 'http://' + req.headers.host + '/';
            var mailOptions = {
                to: user.email,
                from: 'gestiunecontracte@anevar.ro',
                subject: 'Inregistrare',
                html: '<h2>Buna ziua, <b>' + user.fullName + '</b>!</h2><br/>' +
                'Ati fost inregistrat(a) cu success pe <a href="' + websiteUrl + '">site-ul nostru</a> cu numele de utilizator <b>' + user.username + '</b>.<br/>'
            };
            if (user.unencryptedPassword) {
                //send password too
                mailOptions.html += 'Parola dvs. este: <b>' + user.unencryptedPassword + '</b><br/>Parola poate fi schimbata oricand se doreste din panoul de control.<br/>';
            }

            mailOptions.html += '<br/>Anevar Gestiune Contracte';
            smtpTrans.sendMail(mailOptions, function (err) {
                if (err)
                    return res.json(err);
                return res.json(mailOptions);
            });
        }
    });
};

exports.updateUsers = function (req, res) {
    var tablecrud = new CRUD('users', fieldNames);
    var user = req.body;

    if (user.password && user.password != '')
        user.password = bCrypt.hashSync(user.password, 10);

    if (user.pChange)
        user.id = req.session.user.id_admin;


    tablecrud.insertUpdateRecord(user, function (err, response) {
        if (err) {
            var errCode = err.code;
            switch (errCode) {
                case 1021:
                    res.status(400).send('An error has occured: Disk full; waiting for someone to free some space... .');
                    break;
                case 1022:
                    res.status(409).send('Duplicate entry');
                    break;
                default:
                    res.status(400).send('An error has occured.');
                    break;
            }
        }
        else {
            console.log(response);
            if (user.id == req.session.user.id_admin) {
                response.newName = user.fullName;
                req.session.user.fullName = user.fullName;
            }
            return res.json(response);
        }

    })
};

exports.deleteUsers = function (req, res) {
    var tablecrud = new CRUD('users', fieldNames);
    var user = req.body;
    if (user) {
        tablecrud.deleteRecords(user, function (err, result) {
            if (err) {
                var errCode = err.code;
                switch (errCode) {
                    case 1021:
                        res.status(400).send('An error has occured: Disk full; waiting for someone to free some space... .');
                        break;
                    case 1022:
                        res.status(409).send('Duplicate entry');
                        break;
                    default:
                        res.status(400).send('An error has occured.');
                        break;
                }
            }
            else
                return res.json(result);
        });
    } else {
        return res.json({});
    }
};

exports.checkField = function (req, res) {
    var filters = req.body;
    if (Object.keys(filters).length > 0) {
        var filterArray = [];
        for (var key in filters) {
            if (key && filters[key]) {
                filterString = "`" + key + "`" + ' = ' + "'" + filters[key] + "'";
                filterArray.push(filterString);
            }
        }

        if (filterArray.length > 0)
            filterString = " WHERE " + filterArray.join(" AND ");
        else
            filterString = "";
    }
    var query = "SELECT * FROM `users`";
    if (filterString != "") {
        query += filterString + " ORDER BY id ASC";
        var connection = mysql.createConnection(mySqlConfig);

        connection.query(query, function (err, result) {
            if (err) {
                connection.end();
                return res.send(err);
            }
            if (result && result.length > 0) {
                connection.end();
                return res.json(false);
            } else {
                connection.end();
                return res.json(true);
            }
        });

    }
};

var randomPassword = function () {
    var length = 10;
    var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP1234567890!#$";
    var pass = "";
    for (var x = 0; x < length; x++) {
        var i = Math.floor(Math.random() * chars.length);
        pass += chars.charAt(i);
    }
    return pass;
};