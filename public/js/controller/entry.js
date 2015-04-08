var fs = require('fs');
var entryVM = require('./vm/entry_vm');
var api = require('../lib/api');
var view = require('../lib/view');
var period = require('../lib/period');
var handle_error = require('../lib/handle_error');

var entryTemplate = fs.readFileSync(__dirname +
    '/../../templates/entry.html', { encoding: 'utf8' });

var entryViewTemplate = fs.readFileSync(__dirname +
    '/../../templates/entry_view.html', { encoding: 'utf8' });

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
            };
        });

        // Handler for copying the entry.

        data.copy = function() {

            api.entry.get(id).then(function(entry) {

                return api.account.all().then(function(accounts) {

                    // Unset entry id.

                    entry.$id = null;

                    view.show(entryTemplate, entryVM(accounts, entry));

                    // Set focus to title field.

                    document.getElementById('entry-title').focus();
                });

            }).catch(handle_error);
        };

        view.show(entryViewTemplate, data);
    });
};

var entriesTemplate = fs.readFileSync(__dirname +
    '/../../templates/entries.html', { encoding: 'utf8' });

// Shows the list of entries.

exports.list = function() {

    var start = period.start(), end = period.end();

    return api.entry.list(start, end).then(function(entries) {

        view.show(entriesTemplate, { entries: entries });
    });
};

var expandedTemplate = fs.readFileSync(__dirname +
    '/../../templates/expanded.html', { encoding: 'utf8' });

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
                });
            });

            view.show(expandedTemplate, { entries: entries });
        });
    });
};

// Shows the edit form for the entry.

exports.edit = function(id) {

    return api.entry.get(id).then(function(entry) {

        return api.account.all().then(function(accounts) {

            view.show(entryTemplate, entryVM(accounts, entry));

            document.getElementById('entry-title').focus();
        });
    });
};

// Shows the edit form for adding a new entry.

exports.add = function(id) {

    return api.account.all().then(function(accounts) {

        view.show(entryTemplate, entryVM(accounts));

        document.getElementById('entry-title').focus();
    });
};
