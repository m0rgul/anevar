var mysql = require('mysql'),
    async = require('async'),
    dateFormat = require('dateformat'),
    nodemailer = require('nodemailer'),
    smtpTransport = require("nodemailer-smtp-transport");

exports.checkContracts = function (req, res) {
    async.waterfall([
            getRecords = function (callback) {
                var connection = mysql.createConnection(mySqlConfig);
                var query = "SELECT id, contract_no, contract_date, expiration_date ,30_day_notification_sent, 15_day_notification_sent, provider, beneficiary FROM `contracts` ORDER BY expiration_date ASC";

                connection.query(query, function (err, rows) {
                    if (err)
                        return callback(err);
                    callback(null, rows);
                });
            },
            checkDates = function (records, callback) {
                var expiringContracts = [];
                var now = new Date();
                now.setHours(0, 0, 0, 0);

                records.forEach(function (record) {
                    var expDate = new Date(record.expiration_date);
                    var daysLeft = daysBetweenDates(expDate, now);

                    if (daysLeft >= 0) {
                        if (daysLeft <= 30 && daysLeft > 15 && !record['30_day_notification_sent']) {
                            record.send30DayNotification = true;
                            expiringContracts.push(record);
                        }
                        if (daysLeft <= 15 && !record['15_day_notification_sent']) {
                            record.send15DayNotification = true;
                            expiringContracts.push(record);
                        }
                    }
                });
                callback(null, expiringContracts);

            },
            sendEmails = function (expiringContracts, callback) {
                if (expiringContracts.length == 0)
                    return callback(null, []);

                var now = new Date();
                now.setHours(0, 0, 0, 0);

                var smtpTrans = nodemailer.createTransport(
                    smtpTransport({
                        host: "s62.rohost.com",
                        secureConnection: false,
                        port: 465,
                        auth: {
                            user: "gestiunecontracte@anevar.ro",
                            pass: "TeS%h7tmCuZ9"
                        }
                    }));

                var mailOptions = {
                    to: 'ioan.mihali.bv@gmail.com, bogdan@bluemind-software.ro, alina.grigore@anevar.ro',
                    from: 'gestiunecontracte@anevar.ro',
                    subject: 'Expirare contracte',
                    html: '<h2>Buna ziua, </h2><br/>' +
                    'Va trimitem acest email pentru a va anunta ca urmatoarele contracte se apropie de termenul de expirare:<br/>',
                    text: 'Buna ziua, \nVa trimitem acest email pentru a va anunta ca urmatoarele contracte se apropie de termenul de expirare:\n\n'
                };

                expiringContracts.forEach(function (contract) {
                    var expDate = new Date(contract.expiration_date);
                    var daysLeft = daysBetweenDates(expDate, now);
                    var contractHTML = '<br/><i>Contractul nr. ' + contract.contract_no + ' / '
                        + dateFormat(contract.contract_date, "dd/mm/yyyy") + ', prestator: <b>' + contract.provider + '</b> va expira pe data de ' + dateFormat(contract.expiration_date, "dd/mm/yyyy")
                        + ', adica peste ' + daysLeft + ' zile.</i>';
                    var contractText = 'Contractul nr. ' + contract.contract_no + ' / '
                        + dateFormat(contract.contract_date, "dd/mm/yyyy") + ', prestator:' + contract.provider + '  va expira pe data de ' + dateFormat(contract.expiration_date, "dd/mm/yyyy")
                        + ', adica peste ' + daysLeft + ' zile.\n';

                    mailOptions.html += contractHTML;
                    mailOptions.text += contractText;
                });

                var link = 'http://' + req.headers.host;
                mailOptions.html += '<br/><br/>Va invitam sa accesati <a href="' + link + '">aplicatia de gestiune a contractelor</a> pentru mai multe detalii.<br/>Va dorim o zi buna.';
                mailOptions.text += '\n\nPentru mai multe detalii, va invitam sa accesati aplicatia de gestiune a contractelor: ' + link + '\nVa dorim o zi buna.';

                smtpTrans.sendMail(mailOptions, function (err) {
                    if (err)
                        return callback(err);
                    callback(null, expiringContracts);
                });

            },
            writeFields = function (expiringContracts, callback) {
                if (expiringContracts.length == 0)
                    callback(null, []);
                var connection = mysql.createConnection(mySqlConfig);
                var db = 'contracts';
                async.each(expiringContracts, function (contract) {
                    var query = "UPDATE ?? SET ? WHERE `id` = ?";
                    if (contract.send30DayNotification)
                        query = mysql.format(query, [db, {'30_day_notification_sent': true}, contract.id]);
                    if (contract.send15DayNotification)
                        query = mysql.format(query, [db, {'15_day_notification_sent': true}, contract.id]);
                    connection.query(query, function (err) {
                        if (err)
                            return callback(err);
                        callback(null);
                    });
                });
                callback(null, expiringContracts);
            }

        ],
        function (err, results) {
            if (err)
                console.log(err);
            else
                return res.json(results);

        });
};

var daysBetweenDates = function daysBetweenDates(firstDate, secondDate) {
    var oneDay = 24 * 60 * 60 * 1000;
    return Math.round((firstDate.getTime() - secondDate.getTime()) / (oneDay));
};