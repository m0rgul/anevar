var CRUD = require('../modules/mysql_crud.js'),
    mysql = require('mysql'),
    async = require('async');

var fieldNames = ['contract_no', 'contract_date', 'provider', 'beneficiary', 'contract_object', 'last_addendum',
    'expiration_date', 'can_renew', 'contract_value', 'contract_rent', 'utilities', 'other_expenses', 'comments', 'user_id'];

exports.getContractsList = function (req, res) {
    var tablecrud = new CRUD('contracts', fieldNames);

    var filters = req.query.filters ? JSON.parse(req.query.filters) : {};
    var sort = req.query.sort ? JSON.parse(req.query.sort) : {};
    if (Object.keys(sort).length == 0)
        sort = {expiration_date: 'asc'};
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

exports.addUpdateContract = function (req, res) {
    var tablecrud = new CRUD('contracts', fieldNames);
    var user = req.body;

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
            return res.send('ok');
        }
    });
};

exports.removeContract = function (req, res) {
    var tablecrud = new CRUD('contracts', fieldNames);
    var contract = req.body;
    if (contract) {
        tablecrud.deleteRecords(contract, function (err, result) {
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