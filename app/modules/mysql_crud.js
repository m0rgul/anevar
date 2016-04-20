var async = require('async');
module.exports = CRUD;

function CRUD(table, fieldNames) {
    that = this;
    that.table = table;
    that.fieldNames = fieldNames;

    that.mysql = require('mysql');
}

CRUD.prototype.getList = function getList(filters, sort, page, perPage, callback) {
    var filterString = "";
    var connection = that.mysql.createConnection(mySqlConfig);

    if (Object.keys(filters).length > 0) {
        var filterArray = [];
        for (var key in filters) {
            if (key && filters[key]) {
                if (key.indexOf('id') >= 0 || key.indexOf('can_renew') >= 0)
                    filterString = "`" + key + "`" + ' = ' + filters[key];
                else
                    filterString = "`" + key + "`" + ' LIKE ' + "'%" + filters[key] + "%'";
                filterArray.push(filterString);
            }
        }

        if (filterArray.length > 0)
            filterString = " WHERE " + filterArray.join(" AND ");
        else
            filterString = "";
    }

    var query = "SELECT * FROM " + this.table;
    if (filterString != "")
        query += filterString + " ";
    if (Object.keys(sort).length > 0) {
        query += " ORDER BY ";
        for (var key in sort) {
            query += key + " " + sort[key];
        }
    } else
        query += " ORDER BY id ASC";

    async.waterfall([
        countRecords = function (cb) {
            connection.query(query, function (err, rows) {
                if (err)
                    return cb(err);
                cb(null, rows.length);
            });
        },
        getRecords = function (total, cb) {
            if (page && perPage) {
                var offset = (page - 1) * perPage;
                query += " LIMIT " + offset + "," + perPage;
            }

            connection.query(query, function (err, rows) {
                if (err) {
                    return cb(err);
                }

                var result = {
                    total: total,
                    records: []
                };

                if (rows && rows.length > 0) {
                    result.records = rows;
                }
                cb(null, result);
            });
        }
    ], function (err, results) {
        connection.end();
        if (err)
            return callback(err);
        return callback(null, results);
    });


};

CRUD.prototype.insertUpdateRecord = function insertUpdateRecord(request_body, callback) {
    var connection = that.mysql.createConnection(mySqlConfig);

    var fieldData = {};
    var lastId = 0;

    var element = request_body;

    var id = 0;
    var query = "";
    if (element['id'] !== undefined) {
        id = parseInt(element['id']);
        if (isNaN(id))
            id = 0;
    }
    that.fieldNames.forEach(function (fName) {
        if (element.hasOwnProperty(fName))
            fieldData[fName] = element[fName];
    });

    if (id == '' || id == '0' || id == 0) {
        query = "INSERT INTO " + that.table + " SET ?";
        query = that.mysql.format(query, fieldData);
    } else {
        query = "UPDATE " + "`" + that.table + "`" + " SET ? WHERE `id`=?";
        query = that.mysql.format(query, [fieldData, id]);
    }

    connection.query(query, function (err, result) {
        if (err) {
            connection.end();
            return callback(err);
        }
        else {
            lastId = result.insertId;
            connection.end();
            var resp = {
                "success": true,
                "msg": "The modifications have been successfully applied."
            };
            callback(null, resp);
        }
    });
};

CRUD.prototype.deleteRecords = function deleteRecords(request_body, callback) {
    var connection = that.mysql.createConnection(mySqlConfig);

    var query = "DELETE FROM " + that.table + " WHERE id = " + request_body['id'];

    connection.query(query, function (err, result) {
        if (err) {
            connection.end();
            return callback(err);
        }

        var resp = {
            "success": true,
            "msg": "The modifications have been successfully applied, deleted " + result.affectedRows + ' rows'
        };
        connection.end();
        return callback(null, resp);
    });
};