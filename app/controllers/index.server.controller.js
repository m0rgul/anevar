exports.renderHome = function (req, res) {
    if (!req.session || !req.session.user) {
        // sesiune expirata
        res.redirect('/');
    }
    else {
        res.redirect('/contracts');
    }
};

exports.renderUsers = function (req, res) {
    res.render('users.ejs', {user: req.session.user});
};

exports.renderContracts = function (req, res) {
    res.render('contracts.ejs', {user: req.session.user});
};

exports.renderLogin = function (req, res) {
    res.render('login.ejs');
};

exports.renderSettings = function (req, res) {
    res.render('accountSettings.ejs', {user: req.session.user});
};