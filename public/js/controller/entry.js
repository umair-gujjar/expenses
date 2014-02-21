var entryVM = require('./vm/entry_vm');
var api = require('../lib/api');
var view = require('../lib/view');
var period = require('../lib/period');

// Shows single entry.

exports.view = function(id) {

    return api.entry.full(id).then(function(data) {

        data.items.forEach(function(item) {

            item.debit = data.accounts[item.debit];
            item.credit = data.accounts[item.credit];
        });

        data.changes = Object.keys(data.changes).map(function(key) {

            return {
                account: data.accounts[key],
                change: data.changes[key]
            }
        });

        // Handler for copying the entry.

        data.copy = function() {

            api.entry.get(id).then(function(entry) {

                return api.account.all().then(function(accounts) {

                    // Unset entry id.

                    entry.$id = null;

                    return view.show('entry', entryVM(accounts, entry)).then(function() {

                        // Set focus to title field.

                        document.getElementById('entry-title').focus();
                    });
                });

            }).done();
        };

        return view.show('entry_view', data);
    });
};

// Shows the list of entries.

exports.list = function() {

    var start = period.start(), end = period.end();

    return api.entry.list(start, end).then(function(entries) {

        return view.show('entries', { entries: entries });
    });
};

// Shows the list of expanded entries.

exports.expanded = function() {

    var start = period.start(), end = period.end();

    return api.entry.list(start, end).then(function(entries) {

        return api.account.all().then(function(accounts) {

            var map = {};

            accounts.forEach(function(account) {

                map[account.$id] = account;
            });

            entries.forEach(function(entry) {

                entry.items.forEach(function(item) {

                    item.debit = map[item.debit];
                    item.credit = map[item.credit];
                })
            });

            return view.show('expanded', { entries: entries });
        });
    });
};

// Shows the edit form for the entry.

exports.edit = function(id) {

    return api.entry.get(id).then(function(entry) {

        return api.account.all().then(function(accounts) {

            return view.show('entry', entryVM(accounts, entry)).then(function() {

                document.getElementById('entry-title').focus();
            });
        });
    });
};

// Shows the edit form for adding a new entry.

exports.add = function(id) {

    return api.account.all().then(function(accounts) {

        return view.show('entry', entryVM(accounts)).then(function() {

            document.getElementById('entry-title').focus();
        });
    });
};
