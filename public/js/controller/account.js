var accountVM = require('./vm/account_vm');
var api = require('../lib/api');
var view = require('../lib/view');
var period = require('../lib/period');

// Shows the list of accounts.

exports.list = function() {

    return api.account.all().then(function(accounts) {

        return view.show('accounts', { accounts: accounts });
    });
};

// Shows entry items for the given account.

exports.items = function(id) {

    var start = period.start(), end = period.end();

    return api.account.items(id, start, end).then(function(accounts) {

        return api.account.get(id).then(function(account) {

            var total = 0;

            accounts.forEach(function(account) {

                total += account.effect;
            });

            return view.show('account_entries', {

                accounts: accounts,
                account: account,
                total: total
            });
        });
    });
};

// Shows the new account form.

exports.add = function() {

    return view.show('account', accountVM());
};

// Shows the account edit form for the given account.

exports.edit = function(id) {

    return api.account.get(id).then(function(data) {

        return view.show('account', accountVM(data));
    });
};

return exports;
