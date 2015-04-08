var fs = require('fs');
var accountVM = require('./vm/account_vm');
var api = require('../lib/api');
var view = require('../lib/view');
var period = require('../lib/period');

var accountsTemplate = fs.readFileSync(__dirname +
    '/../../templates/accounts.html', { encoding: 'utf8' });

// Shows the list of accounts.

exports.list = function() {

    return api.account.all().then(function(accounts) {

        return view.show(accountsTemplate, { accounts: accounts });
    });
};

var itemsTemplate = fs.readFileSync(__dirname +
    '/../../templates/account_entries.html', { encoding: 'utf8' });

// Shows entry items for the given account.

exports.items = function(id) {

    var start = period.start(), end = period.end();

    return api.account.items(id, start, end).then(function(accounts) {

        return api.account.get(id).then(function(account) {

            var total = 0;

            accounts.forEach(function(account) {

                total += account.effect;
            });

            return view.show(itemsTemplate, {

                accounts: accounts,
                account: account,
                total: total
            });
        });
    });
};

var accountTemplate = fs.readFileSync(__dirname +
    '/../../templates/account.html', { encoding: 'utf8' });

// Shows the new account form.

exports.add = function() {

    return Promise.resolve().then(function() {

        view.show(accountTemplate, accountVM());
    });
};

// Shows the account edit form for the given account.

exports.edit = function(id) {

    return api.account.get(id).then(function(data) {

        view.show(accountTemplate, accountVM(data));
    });
};
