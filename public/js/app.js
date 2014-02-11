ko.extenders.number = function(target, opt) {

    var result = ko.computed({

        read: target,

        write: function(value) {

            if (value.substr) {

                value = parseFloat(value);

                if (Number.isNaN(value)) {

                    value = 0
                };
            }

            target(value);

            target.valueHasMutated();
        }
    });

    return result;
};

var app = {

    data: ko.observable(),
    view: ko.observable('entries'),
    currencies: ko.observableArray(['EUR', 'USD', 'GBP']),

};

//ko.applyBindings(app);

route(/^entries/, function() {

    var url = '/api/entries/' + period.start() + '/' + period.end();

    XHR.get(url).then(function(entries) {

        entries.forEach(function(entry) {

            entry.date = moment.unix(entry.date).format('DD.MM.YYYY');

            if (entry.items.length === 1) {

                entry.amount = entry.items[0].eur_amount;
            }
        });

        show('entries', {

            entries: entries
        });

    }).done();
});

route(/^entry\/edit\/([a-z0-9\-]+)/, function(id) {

    XHR.get('/api/entry/' + id).then(function(entryData) {

        return XHR.get('/api/accounts').then(function(accounts) {

            accounts.forEach(function(account) {

                account.toString = function() {

                    return this.code + ' (' + this.name + ')';
                };
            });

            var entry = data.entryVM(accounts, entryData);

            entry.save = function() {

                XHR.put('/api/entry/' + id, entry.toJS()).done(function() {

                    window.location.hash = '#entries';

                    message('The entry is saved.');
                });

            };

            entry.remove = function() {

                if (confirm('Remove the entry?')) {

                    XHR.delete('/api/entry/' + entry.$id).done(function() {

                        window.location.hash = '#entries';

                        message('The entry is deleted.');

                    });
                }
            };

            entry.copy = function() {

                XHR.put('/api/entry/' + entry.$id + '/copy').done(function(id) {

                    window.location.hash = '#entry/edit/' + id;

                    message('The entry is copied.');
                });
            };

            show('entry', entry, function() {

                document.getElementById('entry-title').focus();
            });
        });

    }).done();
});

route(/^entry\/view\/([a-z0-9\-]+)/, function(id) {

    XHR.get('/api/entry/' + id).then(function(entry) {

        entry.date = moment.unix(entry.date).format('DD.MM.YYYY');

        entry.copy = function() {

            XHR.put('/api/entry/' + id + '/copy').done(function(id) {

                window.location.hash = '#entry/edit/' + id;

                message('The entry is copied.');
            });
        };

        show('entry_view', entry);

    }).done();
});

route(/^entry\/add/, function() {

    XHR.get('/api/accounts').then(function(accounts) {

        accounts.forEach(function(account) {

            account.toString = function() {

                return this.code + ' (' + this.name + ')';
            };
        });

        var entry = data.entryVM(accounts);

        entry.save = function() {

            XHR.post('/api/entry', entry.toJS()).done(function() {

                window.location.hash = '#entries';

                message('The entry is saved.');
            });
        };

        entry.remove = function() {

            // FIXME does nothing.
        };

        entry.copy = function() {

            // FIXME does nothing.
        };

        show('entry', entry);

    }).done();
});

route(/^accounts/, function() {

    XHR.get('/api/accounts').then(function(accounts) {

        show('accounts', {

            accounts: accounts
        });

    }).done();
});

route(/^account\/add/, function() {

    var account = data.accountVM();

    account.save = function() {

        XHR.post('/api/account', account.toJS()).done(function() {

            window.location.hash = '#accounts';

            message('Account is saved.');
        });
    };

    // FIXME not used

    account.remove = function() {

    };

    show('account', account);
});

route(/^account\/edit\/(.+)/, function(id) {

    XHR.get('/api/account/' + id).then(function(accountData) {

        var account = data.accountVM(accountData);

        account.save = function() {

            XHR.put('/api/account/' + id, account.toJS()).done(function() {

                window.location.hash = '#accounts';
            });
        };

        account.remove = function() {

            if (confirm('Delete the account?')) {

                XHR.delete('/api/account/' + id).then(function(response) {

                    window.location.hash = '#accounts';

                }, function(err) {

                    message('Cannot delete the account. ' + err.message, 'alert-danger');
                });
            }
        };

        show('account', account);

    }).done();
});

route(/^account\/(.+)\/items/, function(id) {

    var url = '/api/account/' + id + '/items/' +
        period.start() + '/' + period.end();

    XHR.get(url).then(function(accounts) {

        accounts.forEach(function(account) {

            account.date = moment.unix(account.date).format('DD.MM.YYYY');
        });

        show('account_entries', { accounts: accounts });

    }).done();
});

route(/.*/, function() {

    route.go('entries');
});

function show(id, model, after) {

    var content = document.getElementById('content');

    if (content.children.length === 1) {

        ko.removeNode(content.children[0]);
    }

    XHR.template('/templates/' + id + '.html').done(function(text) {

        var wrap = document.createElement('div');

        wrap.innerHTML = text;

        content.appendChild(wrap);

        ko.applyBindings(model, wrap);

        if (typeof after === 'function') {

            after(model, wrap);
        }
    });
}

function message(text, clazz) {

    var messages = document.getElementById('messages');

    var message = document.createElement('div');

    var realClazz = 'alert';

    if (clazz) {

        realClazz += ' ' + clazz;

    } else {

        realClazz += ' alert-success';
    }

    message.className = realClazz;
    message.innerHTML = text;

    messages.appendChild(message);

    setTimeout(function() {

        messages.removeChild(message);

    }, 2000);
}

var periodForm = document.getElementById('period');

ko.applyBindings(period, periodForm);
