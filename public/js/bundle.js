(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var entry = require('./controller/entry');
var account = require('./controller/account');
var view = require('./lib/view');
var period = require('./lib/period');
var money = require('./lib/money');
var date = require('./lib/date');

window.formatDate = function(unix) {

    return date.format(unix);
}

window.formatAmount = function(amount) {

    return money.format(amount);
}

route(/^entries/, function() {

    entry.list().done();
});

route(/^entry\/edit\/([a-z0-9\-]+)/, function(id) {

    entry.edit(id).done();
});

route(/^entry\/view\/([a-z0-9\-]+)/, function(id) {

    entry.view(id).done();
});

route(/^entry\/add/, function() {

    entry.add().done();
});

route(/^accounts/, function() {

    account.list().done();
});

route(/^account\/add/, function() {

    account.add().done();
});

route(/^account\/edit\/(.+)/, function(id) {

    account.edit(id).done();
});

route(/^account\/(.+)\/items/, function(id) {

    account.items(id).done();
});

route(/^help/, function() {

    view.show('help', {}).done();
});

route(/.*/, function() {

    route.go('entries');
});

var periodForm = document.getElementById('period');

ko.applyBindings(period, periodForm);

},{"./controller/account":2,"./controller/entry":3,"./lib/date":7,"./lib/money":8,"./lib/period":9,"./lib/view":10}],2:[function(require,module,exports){
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

},{"../lib/api":6,"../lib/period":9,"../lib/view":10,"./vm/account_vm":4}],3:[function(require,module,exports){
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

},{"../lib/api":6,"../lib/period":9,"../lib/view":10,"./vm/entry_vm":5}],4:[function(require,module,exports){
var view = require('../../lib/view');
var api = require('../../lib/api');

module.exports = function(data) {

    var account = {

        $id: null,
        code: ko.observable(),
        name: ko.observable(),
        type: ko.observable(),
        types: ['liability', 'income', 'equity', 'asset', 'expense']
    }

    if (data) {

        account.$id = data.$id;
        account.code(data.code);
        account.name(data.name);
        account.type(data.type);
    }

    account.toJS = function() {

        return {

            code: account.code(),
            name: account.name(),
            type: account.type()
        };
    };

    account.toString = function() {

        return account.code() + ' (' + account.name() + ')';
    };

    account.save = function() {

        if (account.$id) {

            api.account.update(account.$id, account.toJS()).done(function() {

                window.location.hash = '#accounts';
            });

        } else {

            api.account.save(account.toJS()).done(function() {

                window.location.hash = '#accounts';

            });
        }

        view.message('Account is saved.');
    };

    account.remove = function() {

        if (account.$id) {

            if (confirm('Delete the account?')) {

                api.account.remove(account.$id).then(function(response) {

                    window.location.hash = '#accounts';

                }, function(err) {

                    view.message('Cannot delete the account. ' + err.message, 'alert-danger');

                }).done();
            }
        }
    };

    return account;
}

},{"../../lib/api":6,"../../lib/view":10}],5:[function(require,module,exports){
var money = require('../../lib/money');
var date = require('../../lib/date');
var view = require('../../lib/view');
var api = require('../../lib/api');

module.exports = function(accounts, data) {

    var entry = {

        title: ko.observable(),
        $id: null,
        items: ko.observableArray([]),
        accounts: accounts,
        currencies: ['EUR', 'USD', 'GBP']
    };

    if (data) {

        entry.$id = data.$id;
        entry.title(data.title);

        data.items.forEach(function(item) {

            entry.items.push(itemVM(item));
        });
    }

    entry.toJS = function() {

        return {

            title: entry.title(),
            items: entry.items().map(function(item) {

                return item.toJS();
            })
        };
    };

    entry.accountText = function(account) {

        return account.code + ' (' + account.name + ')';
    };

    entry.accountValue = function(account) {

        return account.$id;
    };

    entry.save = function() {

        if (entry.$id) {

            api.entry.update(entry.$id, entry.toJS()).done(function() {

                window.location.hash = '#entry/view/' + entry.$id;
            });

        } else {

            api.entry.save(entry.toJS()).done(function(data) {

                window.location.hash = '#entry/view/' + data;
            });
        }

        view.message('The entry is saved.');
    };

    entry.remove = function() {

        if (entry.$id) {

            if (confirm('Remove the entry?')) {

                api.entry.remove(entry.$id).done(function() {

                    window.location.hash = '#entries';

                    view.message('The entry is deleted.');
                });
            }
        }
    };

    entry.addItem = function() {

        entry.items.push(itemVM());
    };

    entry.removeItem = function(item) {

        if (confirm('Remove the item ' + item.title() + '?')) {
            
            entry.items.remove(item);
        }
    };

    return entry;
}

function itemVM(data) {

    var item = {

        title: ko.observable(),
        date: ko.observable(),
        debit: ko.observable(),
        credit: ko.observable(),
        currency: ko.observable(),
        amount: ko.observable(),
        eur_amount: ko.observable()
    };

    item.eur_orig = ko.computed(function() {

        var amount = item.amount();
        var currency = item.currency();

        if (amount && currency === 'EUR') {

            return amount;
        }

    });

    item.eur_orig.subscribe(function(value) {

        if (value) {

            item.eur_amount(value);
        }
    });

    if (data) {

        item.title(data.title);
        item.date(date.format(data.date));
        item.debit(data.debit);
        item.credit(data.credit);
        item.amount(money.format(data.amount));
        item.currency(data.currency.toUpperCase());
        item.eur_amount(money.format(data.eur_amount));

    } else {

        item.date(date.format(Math.floor(Date.now() / 1000)));
    }

    item.toJS = function() {

        return {

            title: item.title(),
            date: date.parse(item.date()),
            debit: item.debit(),
            credit: item.credit(),
            amount: money.parse(item.amount()),
            currency: item.currency().toLowerCase(),
            eur_amount: money.parse(item.eur_amount())
        };
    };

    return item;
};

},{"../../lib/api":6,"../../lib/date":7,"../../lib/money":8,"../../lib/view":10}],6:[function(require,module,exports){
var XHR = require('./xhr');

exports.entry = {

    full: function(id) {

        return XHR.get('/api/entry/' + id + '/full');
    },

    get: function(id) {

        return XHR.get('/api/entry/' + id);
    },

    list: function(start, end) {

        var url = '/api/entries/' + start + '/' + end;

        return XHR.get(url);
    },

    remove: function(id) {

        return XHR.delete('/api/entry/' + id);
    },

    update: function(id, data) {

        return XHR.put('/api/entry/' + id, data);
    },

    save: function(data) {

        return XHR.post('/api/entry', data);
    }
};

exports.account = {

    all: function() {

        return XHR.get('/api/accounts');
    },

    items: function(id, start, end) {

        var url = '/api/account/' + id + '/items/' +
            start + '/' + end;

        return XHR.get(url);
    },

    get: function(id) {

        return XHR.get('/api/account/' + id);
    },

    update: function(id, data) {

        return XHR.put('/api/account/' + id, data);
    },

    save: function(data) {

        return XHR.post('/api/account', data);
    },

    remove: function(id) {

        return XHR.delete('/api/account/' + id);
    }
};

},{"./xhr":11}],7:[function(require,module,exports){
exports.parse = function(text) {

    var match = text.match(/(\d{2})\.(\d{2})\.(\d{4})/);

    if (match) {

        var monthDate = parseInt(match[1], 10);
        var month = parseInt(match[2], 10) - 1;
        var year = parseInt(match[3], 10);

        var date = new Date();

        date.setUTCHours(0, 0, 0, 0);
        date.setUTCFullYear(year, month, monthDate);

        return Math.floor(date.getTime() / 1000);

    } else {

        throw new Error('Cannot parse date ' + text);
    }
};

exports.format = function(unix) {

    var date = new Date(unix * 1000);

    var year = date.getUTCFullYear();
    var month = date.getUTCMonth() + 1;
    var day = date.getUTCDate();

    function pad(x) {

        return x < 10 ? '0' + x : '' + x;
    }

    return pad(day) + '.' + pad(month) + '.' + year;
};

},{}],8:[function(require,module,exports){
exports.parse = function(string) {

    var match = string.match(/(\d+)(?:\.(\d{2}))?/);

    if (match) {

        var integerPart = parseInt(match[1], 10);
        var fractionalPart = 0;

        if (match[2]) {

            fractionalPart = parseInt(match[2], 10);
        }

        return integerPart * 100 + fractionalPart;

    } else {

        throw new Error('Cannot parse ' + string);
    }
};

exports.format = function(value) {

    var neg = false;

    if (value < 0) {

        neg = true;
        value = -value;
    }

    var integerPart = Math.floor(value / 100);
    var fractionalPart = value % 100;

    return (neg ? '-' : '') + integerPart + '.' +
        ((fractionalPart < 10 ? '0' : '') + fractionalPart);
};

},{}],9:[function(require,module,exports){
exports.start_month = ko.observable();
exports.end_month = ko.observable();

exports.start = function() {

    var month = exports.months.indexOf(exports.start_month());
    var year = parseInt(exports.year(), 10);

    var date = new Date();

    date.setUTCFullYear(year, month, 1);
    date.setUTCHours(0, 0, 0, 0);

    return Math.floor(date.getTime() / 1000);
};

exports.end = function() {

    var month = exports.months.indexOf(exports.end_month());
    var year = parseInt(exports.year(), 10);

    if (month === 11) {

        month = 0;
        year += 1;

    } else {

        month += 1;
    }

    var date = new Date();

    date.setUTCFullYear(year, month, 1);
    date.setUTCHours(0, 0, 0, 0);

    // One day before start of the next month.

    return Math.floor(date.getTime() / 1000) - 1;
};

exports.update = function() {

    route.refresh();
};

var currentDate = new Date();
var currentYear = currentDate.getUTCFullYear();
var currentMonth = currentDate.getUTCMonth();

exports.months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

exports.year = ko.observable(currentYear.toString());
exports.years = [];

for (var y = 2012; y <= currentYear + 1; y++) {

    exports.years.push(y.toString());
}

exports.start_month(exports.months[currentMonth]);
exports.end_month(exports.months[currentMonth]);

return exports;

},{}],10:[function(require,module,exports){
var XHR = require('./xhr');

// Shows template (by id) with the given model

exports.show = function(id, model) {

    var content = document.getElementById('content');

    if (content.children.length === 1) {

        // Something was previously shown,
        // remove it.

        ko.removeNode(content.children[0]);
    }

    // Load template, turn into DOM, bind with KnockoutJS.

    return XHR.template('/templates/' + id + '.html').then(function(text) {

        var wrap = document.createElement('div');

        wrap.innerHTML = text;

        content.appendChild(wrap);

        ko.applyBindings(model, wrap);
    });
};

// Shows informational message.

exports.message = function(text, clazz) {

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
};

},{"./xhr":11}],11:[function(require,module,exports){
exports.get = function(url) {

    var deferred = Q.defer();

    var xhr = new XMLHttpRequest();

    xhr.open('GET', url, true);

    xhr.addEventListener('load', function() {

        deferred.resolve(JSON.parse(xhr.responseText).data);

    }, false);

    xhr.send();

    return deferred.promise;
};

exports.post = function(url, data) {

    var deferred = Q.defer();

    var xhr = new XMLHttpRequest();

    xhr.open('POST', url, true);

    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.addEventListener('load', function() {

        deferred.resolve(JSON.parse(xhr.responseText).data);

    }, false);

    xhr.send(JSON.stringify(data));

    return deferred.promise;
};

exports.put = function(url, data) {

    var deferred = Q.defer();

    var xhr = new XMLHttpRequest();

    xhr.open('PUT', url, true);

    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.addEventListener('load', function() {

        deferred.resolve(JSON.parse(xhr.responseText).data);

    }, false);

    xhr.send(JSON.stringify(data));

    return deferred.promise;
};

exports.delete = function(url) {

    var deferred = Q.defer();

    var xhr = new XMLHttpRequest();

    xhr.open('DELETE', url, true);

    xhr.addEventListener('load', function() {

        var obj = JSON.parse(xhr.responseText);

        if (obj.status === "success") {

            deferred.resolve(obj.data);

        } else {

            deferred.reject(obj);
        }

    }, false);

    xhr.send();

    return deferred.promise;
};

exports.template = function(url) {

    var deferred = Q.defer();

    var xhr = new XMLHttpRequest();

    xhr.open('GET', url, true);

    xhr.addEventListener('load', function() {

        deferred.resolve(xhr.responseText);

    }, false);

    xhr.send();

    return deferred.promise;
};

return exports;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvdXNyL2xvY2FsL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL3JhaXZvL2V4cGVuc2VzMi9wdWJsaWMvanMvYXBwLmpzIiwiL2hvbWUvcmFpdm8vZXhwZW5zZXMyL3B1YmxpYy9qcy9jb250cm9sbGVyL2FjY291bnQuanMiLCIvaG9tZS9yYWl2by9leHBlbnNlczIvcHVibGljL2pzL2NvbnRyb2xsZXIvZW50cnkuanMiLCIvaG9tZS9yYWl2by9leHBlbnNlczIvcHVibGljL2pzL2NvbnRyb2xsZXIvdm0vYWNjb3VudF92bS5qcyIsIi9ob21lL3JhaXZvL2V4cGVuc2VzMi9wdWJsaWMvanMvY29udHJvbGxlci92bS9lbnRyeV92bS5qcyIsIi9ob21lL3JhaXZvL2V4cGVuc2VzMi9wdWJsaWMvanMvbGliL2FwaS5qcyIsIi9ob21lL3JhaXZvL2V4cGVuc2VzMi9wdWJsaWMvanMvbGliL2RhdGUuanMiLCIvaG9tZS9yYWl2by9leHBlbnNlczIvcHVibGljL2pzL2xpYi9tb25leS5qcyIsIi9ob21lL3JhaXZvL2V4cGVuc2VzMi9wdWJsaWMvanMvbGliL3BlcmlvZC5qcyIsIi9ob21lL3JhaXZvL2V4cGVuc2VzMi9wdWJsaWMvanMvbGliL3ZpZXcuanMiLCIvaG9tZS9yYWl2by9leHBlbnNlczIvcHVibGljL2pzL2xpYi94aHIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgZW50cnkgPSByZXF1aXJlKCcuL2NvbnRyb2xsZXIvZW50cnknKTtcbnZhciBhY2NvdW50ID0gcmVxdWlyZSgnLi9jb250cm9sbGVyL2FjY291bnQnKTtcbnZhciB2aWV3ID0gcmVxdWlyZSgnLi9saWIvdmlldycpO1xudmFyIHBlcmlvZCA9IHJlcXVpcmUoJy4vbGliL3BlcmlvZCcpO1xudmFyIG1vbmV5ID0gcmVxdWlyZSgnLi9saWIvbW9uZXknKTtcbnZhciBkYXRlID0gcmVxdWlyZSgnLi9saWIvZGF0ZScpO1xuXG53aW5kb3cuZm9ybWF0RGF0ZSA9IGZ1bmN0aW9uKHVuaXgpIHtcblxuICAgIHJldHVybiBkYXRlLmZvcm1hdCh1bml4KTtcbn1cblxud2luZG93LmZvcm1hdEFtb3VudCA9IGZ1bmN0aW9uKGFtb3VudCkge1xuXG4gICAgcmV0dXJuIG1vbmV5LmZvcm1hdChhbW91bnQpO1xufVxuXG5yb3V0ZSgvXmVudHJpZXMvLCBmdW5jdGlvbigpIHtcblxuICAgIGVudHJ5Lmxpc3QoKS5kb25lKCk7XG59KTtcblxucm91dGUoL15lbnRyeVxcL2VkaXRcXC8oW2EtejAtOVxcLV0rKS8sIGZ1bmN0aW9uKGlkKSB7XG5cbiAgICBlbnRyeS5lZGl0KGlkKS5kb25lKCk7XG59KTtcblxucm91dGUoL15lbnRyeVxcL3ZpZXdcXC8oW2EtejAtOVxcLV0rKS8sIGZ1bmN0aW9uKGlkKSB7XG5cbiAgICBlbnRyeS52aWV3KGlkKS5kb25lKCk7XG59KTtcblxucm91dGUoL15lbnRyeVxcL2FkZC8sIGZ1bmN0aW9uKCkge1xuXG4gICAgZW50cnkuYWRkKCkuZG9uZSgpO1xufSk7XG5cbnJvdXRlKC9eYWNjb3VudHMvLCBmdW5jdGlvbigpIHtcblxuICAgIGFjY291bnQubGlzdCgpLmRvbmUoKTtcbn0pO1xuXG5yb3V0ZSgvXmFjY291bnRcXC9hZGQvLCBmdW5jdGlvbigpIHtcblxuICAgIGFjY291bnQuYWRkKCkuZG9uZSgpO1xufSk7XG5cbnJvdXRlKC9eYWNjb3VudFxcL2VkaXRcXC8oLispLywgZnVuY3Rpb24oaWQpIHtcblxuICAgIGFjY291bnQuZWRpdChpZCkuZG9uZSgpO1xufSk7XG5cbnJvdXRlKC9eYWNjb3VudFxcLyguKylcXC9pdGVtcy8sIGZ1bmN0aW9uKGlkKSB7XG5cbiAgICBhY2NvdW50Lml0ZW1zKGlkKS5kb25lKCk7XG59KTtcblxucm91dGUoL15oZWxwLywgZnVuY3Rpb24oKSB7XG5cbiAgICB2aWV3LnNob3coJ2hlbHAnLCB7fSkuZG9uZSgpO1xufSk7XG5cbnJvdXRlKC8uKi8sIGZ1bmN0aW9uKCkge1xuXG4gICAgcm91dGUuZ28oJ2VudHJpZXMnKTtcbn0pO1xuXG52YXIgcGVyaW9kRm9ybSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwZXJpb2QnKTtcblxua28uYXBwbHlCaW5kaW5ncyhwZXJpb2QsIHBlcmlvZEZvcm0pO1xuIiwidmFyIGFjY291bnRWTSA9IHJlcXVpcmUoJy4vdm0vYWNjb3VudF92bScpO1xudmFyIGFwaSA9IHJlcXVpcmUoJy4uL2xpYi9hcGknKTtcbnZhciB2aWV3ID0gcmVxdWlyZSgnLi4vbGliL3ZpZXcnKTtcbnZhciBwZXJpb2QgPSByZXF1aXJlKCcuLi9saWIvcGVyaW9kJyk7XG5cbi8vIFNob3dzIHRoZSBsaXN0IG9mIGFjY291bnRzLlxuXG5leHBvcnRzLmxpc3QgPSBmdW5jdGlvbigpIHtcblxuICAgIHJldHVybiBhcGkuYWNjb3VudC5hbGwoKS50aGVuKGZ1bmN0aW9uKGFjY291bnRzKSB7XG5cbiAgICAgICAgcmV0dXJuIHZpZXcuc2hvdygnYWNjb3VudHMnLCB7IGFjY291bnRzOiBhY2NvdW50cyB9KTtcbiAgICB9KTtcbn07XG5cbi8vIFNob3dzIGVudHJ5IGl0ZW1zIGZvciB0aGUgZ2l2ZW4gYWNjb3VudC5cblxuZXhwb3J0cy5pdGVtcyA9IGZ1bmN0aW9uKGlkKSB7XG5cbiAgICB2YXIgc3RhcnQgPSBwZXJpb2Quc3RhcnQoKSwgZW5kID0gcGVyaW9kLmVuZCgpO1xuXG4gICAgcmV0dXJuIGFwaS5hY2NvdW50Lml0ZW1zKGlkLCBzdGFydCwgZW5kKS50aGVuKGZ1bmN0aW9uKGFjY291bnRzKSB7XG5cbiAgICAgICAgcmV0dXJuIGFwaS5hY2NvdW50LmdldChpZCkudGhlbihmdW5jdGlvbihhY2NvdW50KSB7XG5cbiAgICAgICAgICAgIHZhciB0b3RhbCA9IDA7XG5cbiAgICAgICAgICAgIGFjY291bnRzLmZvckVhY2goZnVuY3Rpb24oYWNjb3VudCkge1xuXG4gICAgICAgICAgICAgICAgdG90YWwgKz0gYWNjb3VudC5lZmZlY3Q7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHZpZXcuc2hvdygnYWNjb3VudF9lbnRyaWVzJywge1xuXG4gICAgICAgICAgICAgICAgYWNjb3VudHM6IGFjY291bnRzLFxuICAgICAgICAgICAgICAgIGFjY291bnQ6IGFjY291bnQsXG4gICAgICAgICAgICAgICAgdG90YWw6IHRvdGFsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG4vLyBTaG93cyB0aGUgbmV3IGFjY291bnQgZm9ybS5cblxuZXhwb3J0cy5hZGQgPSBmdW5jdGlvbigpIHtcblxuICAgIHJldHVybiB2aWV3LnNob3coJ2FjY291bnQnLCBhY2NvdW50Vk0oKSk7XG59O1xuXG4vLyBTaG93cyB0aGUgYWNjb3VudCBlZGl0IGZvcm0gZm9yIHRoZSBnaXZlbiBhY2NvdW50LlxuXG5leHBvcnRzLmVkaXQgPSBmdW5jdGlvbihpZCkge1xuXG4gICAgcmV0dXJuIGFwaS5hY2NvdW50LmdldChpZCkudGhlbihmdW5jdGlvbihkYXRhKSB7XG5cbiAgICAgICAgcmV0dXJuIHZpZXcuc2hvdygnYWNjb3VudCcsIGFjY291bnRWTShkYXRhKSk7XG4gICAgfSk7XG59O1xuXG5yZXR1cm4gZXhwb3J0cztcbiIsInZhciBlbnRyeVZNID0gcmVxdWlyZSgnLi92bS9lbnRyeV92bScpO1xudmFyIGFwaSA9IHJlcXVpcmUoJy4uL2xpYi9hcGknKTtcbnZhciB2aWV3ID0gcmVxdWlyZSgnLi4vbGliL3ZpZXcnKTtcbnZhciBwZXJpb2QgPSByZXF1aXJlKCcuLi9saWIvcGVyaW9kJyk7XG5cbi8vIFNob3dzIHNpbmdsZSBlbnRyeS5cblxuZXhwb3J0cy52aWV3ID0gZnVuY3Rpb24oaWQpIHtcblxuICAgIHJldHVybiBhcGkuZW50cnkuZnVsbChpZCkudGhlbihmdW5jdGlvbihkYXRhKSB7XG5cbiAgICAgICAgZGF0YS5pdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcblxuICAgICAgICAgICAgaXRlbS5kZWJpdCA9IGRhdGEuYWNjb3VudHNbaXRlbS5kZWJpdF07XG4gICAgICAgICAgICBpdGVtLmNyZWRpdCA9IGRhdGEuYWNjb3VudHNbaXRlbS5jcmVkaXRdO1xuICAgICAgICB9KTtcblxuICAgICAgICBkYXRhLmNoYW5nZXMgPSBPYmplY3Qua2V5cyhkYXRhLmNoYW5nZXMpLm1hcChmdW5jdGlvbihrZXkpIHtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBhY2NvdW50OiBkYXRhLmFjY291bnRzW2tleV0sXG4gICAgICAgICAgICAgICAgY2hhbmdlOiBkYXRhLmNoYW5nZXNba2V5XVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBIYW5kbGVyIGZvciBjb3B5aW5nIHRoZSBlbnRyeS5cblxuICAgICAgICBkYXRhLmNvcHkgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgYXBpLmVudHJ5LmdldChpZCkudGhlbihmdW5jdGlvbihlbnRyeSkge1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFwaS5hY2NvdW50LmFsbCgpLnRoZW4oZnVuY3Rpb24oYWNjb3VudHMpIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBVbnNldCBlbnRyeSBpZC5cblxuICAgICAgICAgICAgICAgICAgICBlbnRyeS4kaWQgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2aWV3LnNob3coJ2VudHJ5JywgZW50cnlWTShhY2NvdW50cywgZW50cnkpKS50aGVuKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgZm9jdXMgdG8gdGl0bGUgZmllbGQuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdlbnRyeS10aXRsZScpLmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9KS5kb25lKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHZpZXcuc2hvdygnZW50cnlfdmlldycsIGRhdGEpO1xuICAgIH0pO1xufTtcblxuLy8gU2hvd3MgdGhlIGxpc3Qgb2YgZW50cmllcy5cblxuZXhwb3J0cy5saXN0ID0gZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgc3RhcnQgPSBwZXJpb2Quc3RhcnQoKSwgZW5kID0gcGVyaW9kLmVuZCgpO1xuXG4gICAgcmV0dXJuIGFwaS5lbnRyeS5saXN0KHN0YXJ0LCBlbmQpLnRoZW4oZnVuY3Rpb24oZW50cmllcykge1xuXG4gICAgICAgIHJldHVybiB2aWV3LnNob3coJ2VudHJpZXMnLCB7IGVudHJpZXM6IGVudHJpZXMgfSk7XG4gICAgfSk7XG59O1xuXG4vLyBTaG93cyB0aGUgZWRpdCBmb3JtIGZvciB0aGUgZW50cnkuXG5cbmV4cG9ydHMuZWRpdCA9IGZ1bmN0aW9uKGlkKSB7XG5cbiAgICByZXR1cm4gYXBpLmVudHJ5LmdldChpZCkudGhlbihmdW5jdGlvbihlbnRyeSkge1xuXG4gICAgICAgIHJldHVybiBhcGkuYWNjb3VudC5hbGwoKS50aGVuKGZ1bmN0aW9uKGFjY291bnRzKSB7XG5cbiAgICAgICAgICAgIHJldHVybiB2aWV3LnNob3coJ2VudHJ5JywgZW50cnlWTShhY2NvdW50cywgZW50cnkpKS50aGVuKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2VudHJ5LXRpdGxlJykuZm9jdXMoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG5cbi8vIFNob3dzIHRoZSBlZGl0IGZvcm0gZm9yIGFkZGluZyBhIG5ldyBlbnRyeS5cblxuZXhwb3J0cy5hZGQgPSBmdW5jdGlvbihpZCkge1xuXG4gICAgcmV0dXJuIGFwaS5hY2NvdW50LmFsbCgpLnRoZW4oZnVuY3Rpb24oYWNjb3VudHMpIHtcblxuICAgICAgICByZXR1cm4gdmlldy5zaG93KCdlbnRyeScsIGVudHJ5Vk0oYWNjb3VudHMpKS50aGVuKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZW50cnktdGl0bGUnKS5mb2N1cygpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG4iLCJ2YXIgdmlldyA9IHJlcXVpcmUoJy4uLy4uL2xpYi92aWV3Jyk7XG52YXIgYXBpID0gcmVxdWlyZSgnLi4vLi4vbGliL2FwaScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGRhdGEpIHtcblxuICAgIHZhciBhY2NvdW50ID0ge1xuXG4gICAgICAgICRpZDogbnVsbCxcbiAgICAgICAgY29kZToga28ub2JzZXJ2YWJsZSgpLFxuICAgICAgICBuYW1lOiBrby5vYnNlcnZhYmxlKCksXG4gICAgICAgIHR5cGU6IGtvLm9ic2VydmFibGUoKSxcbiAgICAgICAgdHlwZXM6IFsnbGlhYmlsaXR5JywgJ2luY29tZScsICdlcXVpdHknLCAnYXNzZXQnLCAnZXhwZW5zZSddXG4gICAgfVxuXG4gICAgaWYgKGRhdGEpIHtcblxuICAgICAgICBhY2NvdW50LiRpZCA9IGRhdGEuJGlkO1xuICAgICAgICBhY2NvdW50LmNvZGUoZGF0YS5jb2RlKTtcbiAgICAgICAgYWNjb3VudC5uYW1lKGRhdGEubmFtZSk7XG4gICAgICAgIGFjY291bnQudHlwZShkYXRhLnR5cGUpO1xuICAgIH1cblxuICAgIGFjY291bnQudG9KUyA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHJldHVybiB7XG5cbiAgICAgICAgICAgIGNvZGU6IGFjY291bnQuY29kZSgpLFxuICAgICAgICAgICAgbmFtZTogYWNjb3VudC5uYW1lKCksXG4gICAgICAgICAgICB0eXBlOiBhY2NvdW50LnR5cGUoKVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICBhY2NvdW50LnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgcmV0dXJuIGFjY291bnQuY29kZSgpICsgJyAoJyArIGFjY291bnQubmFtZSgpICsgJyknO1xuICAgIH07XG5cbiAgICBhY2NvdW50LnNhdmUgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICBpZiAoYWNjb3VudC4kaWQpIHtcblxuICAgICAgICAgICAgYXBpLmFjY291bnQudXBkYXRlKGFjY291bnQuJGlkLCBhY2NvdW50LnRvSlMoKSkuZG9uZShmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gJyNhY2NvdW50cyc7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICBhcGkuYWNjb3VudC5zYXZlKGFjY291bnQudG9KUygpKS5kb25lKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSAnI2FjY291bnRzJztcblxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICB2aWV3Lm1lc3NhZ2UoJ0FjY291bnQgaXMgc2F2ZWQuJyk7XG4gICAgfTtcblxuICAgIGFjY291bnQucmVtb3ZlID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgaWYgKGFjY291bnQuJGlkKSB7XG5cbiAgICAgICAgICAgIGlmIChjb25maXJtKCdEZWxldGUgdGhlIGFjY291bnQ/JykpIHtcblxuICAgICAgICAgICAgICAgIGFwaS5hY2NvdW50LnJlbW92ZShhY2NvdW50LiRpZCkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gJyNhY2NvdW50cyc7XG5cbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcblxuICAgICAgICAgICAgICAgICAgICB2aWV3Lm1lc3NhZ2UoJ0Nhbm5vdCBkZWxldGUgdGhlIGFjY291bnQuICcgKyBlcnIubWVzc2FnZSwgJ2FsZXJ0LWRhbmdlcicpO1xuXG4gICAgICAgICAgICAgICAgfSkuZG9uZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBhY2NvdW50O1xufVxuIiwidmFyIG1vbmV5ID0gcmVxdWlyZSgnLi4vLi4vbGliL21vbmV5Jyk7XG52YXIgZGF0ZSA9IHJlcXVpcmUoJy4uLy4uL2xpYi9kYXRlJyk7XG52YXIgdmlldyA9IHJlcXVpcmUoJy4uLy4uL2xpYi92aWV3Jyk7XG52YXIgYXBpID0gcmVxdWlyZSgnLi4vLi4vbGliL2FwaScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFjY291bnRzLCBkYXRhKSB7XG5cbiAgICB2YXIgZW50cnkgPSB7XG5cbiAgICAgICAgdGl0bGU6IGtvLm9ic2VydmFibGUoKSxcbiAgICAgICAgJGlkOiBudWxsLFxuICAgICAgICBpdGVtczoga28ub2JzZXJ2YWJsZUFycmF5KFtdKSxcbiAgICAgICAgYWNjb3VudHM6IGFjY291bnRzLFxuICAgICAgICBjdXJyZW5jaWVzOiBbJ0VVUicsICdVU0QnLCAnR0JQJ11cbiAgICB9O1xuXG4gICAgaWYgKGRhdGEpIHtcblxuICAgICAgICBlbnRyeS4kaWQgPSBkYXRhLiRpZDtcbiAgICAgICAgZW50cnkudGl0bGUoZGF0YS50aXRsZSk7XG5cbiAgICAgICAgZGF0YS5pdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcblxuICAgICAgICAgICAgZW50cnkuaXRlbXMucHVzaChpdGVtVk0oaXRlbSkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBlbnRyeS50b0pTID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgcmV0dXJuIHtcblxuICAgICAgICAgICAgdGl0bGU6IGVudHJ5LnRpdGxlKCksXG4gICAgICAgICAgICBpdGVtczogZW50cnkuaXRlbXMoKS5tYXAoZnVuY3Rpb24oaXRlbSkge1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0udG9KUygpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgZW50cnkuYWNjb3VudFRleHQgPSBmdW5jdGlvbihhY2NvdW50KSB7XG5cbiAgICAgICAgcmV0dXJuIGFjY291bnQuY29kZSArICcgKCcgKyBhY2NvdW50Lm5hbWUgKyAnKSc7XG4gICAgfTtcblxuICAgIGVudHJ5LmFjY291bnRWYWx1ZSA9IGZ1bmN0aW9uKGFjY291bnQpIHtcblxuICAgICAgICByZXR1cm4gYWNjb3VudC4kaWQ7XG4gICAgfTtcblxuICAgIGVudHJ5LnNhdmUgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICBpZiAoZW50cnkuJGlkKSB7XG5cbiAgICAgICAgICAgIGFwaS5lbnRyeS51cGRhdGUoZW50cnkuJGlkLCBlbnRyeS50b0pTKCkpLmRvbmUoZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaGFzaCA9ICcjZW50cnkvdmlldy8nICsgZW50cnkuJGlkO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgYXBpLmVudHJ5LnNhdmUoZW50cnkudG9KUygpKS5kb25lKGZ1bmN0aW9uKGRhdGEpIHtcblxuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gJyNlbnRyeS92aWV3LycgKyBkYXRhO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICB2aWV3Lm1lc3NhZ2UoJ1RoZSBlbnRyeSBpcyBzYXZlZC4nKTtcbiAgICB9O1xuXG4gICAgZW50cnkucmVtb3ZlID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgaWYgKGVudHJ5LiRpZCkge1xuXG4gICAgICAgICAgICBpZiAoY29uZmlybSgnUmVtb3ZlIHRoZSBlbnRyeT8nKSkge1xuXG4gICAgICAgICAgICAgICAgYXBpLmVudHJ5LnJlbW92ZShlbnRyeS4kaWQpLmRvbmUoZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSAnI2VudHJpZXMnO1xuXG4gICAgICAgICAgICAgICAgICAgIHZpZXcubWVzc2FnZSgnVGhlIGVudHJ5IGlzIGRlbGV0ZWQuJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZW50cnkuYWRkSXRlbSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGVudHJ5Lml0ZW1zLnB1c2goaXRlbVZNKCkpO1xuICAgIH07XG5cbiAgICBlbnRyeS5yZW1vdmVJdGVtID0gZnVuY3Rpb24oaXRlbSkge1xuXG4gICAgICAgIGlmIChjb25maXJtKCdSZW1vdmUgdGhlIGl0ZW0gJyArIGl0ZW0udGl0bGUoKSArICc/JykpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZW50cnkuaXRlbXMucmVtb3ZlKGl0ZW0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBlbnRyeTtcbn1cblxuZnVuY3Rpb24gaXRlbVZNKGRhdGEpIHtcblxuICAgIHZhciBpdGVtID0ge1xuXG4gICAgICAgIHRpdGxlOiBrby5vYnNlcnZhYmxlKCksXG4gICAgICAgIGRhdGU6IGtvLm9ic2VydmFibGUoKSxcbiAgICAgICAgZGViaXQ6IGtvLm9ic2VydmFibGUoKSxcbiAgICAgICAgY3JlZGl0OiBrby5vYnNlcnZhYmxlKCksXG4gICAgICAgIGN1cnJlbmN5OiBrby5vYnNlcnZhYmxlKCksXG4gICAgICAgIGFtb3VudDoga28ub2JzZXJ2YWJsZSgpLFxuICAgICAgICBldXJfYW1vdW50OiBrby5vYnNlcnZhYmxlKClcbiAgICB9O1xuXG4gICAgaXRlbS5ldXJfb3JpZyA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBhbW91bnQgPSBpdGVtLmFtb3VudCgpO1xuICAgICAgICB2YXIgY3VycmVuY3kgPSBpdGVtLmN1cnJlbmN5KCk7XG5cbiAgICAgICAgaWYgKGFtb3VudCAmJiBjdXJyZW5jeSA9PT0gJ0VVUicpIHtcblxuICAgICAgICAgICAgcmV0dXJuIGFtb3VudDtcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICBpdGVtLmV1cl9vcmlnLnN1YnNjcmliZShmdW5jdGlvbih2YWx1ZSkge1xuXG4gICAgICAgIGlmICh2YWx1ZSkge1xuXG4gICAgICAgICAgICBpdGVtLmV1cl9hbW91bnQodmFsdWUpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAoZGF0YSkge1xuXG4gICAgICAgIGl0ZW0udGl0bGUoZGF0YS50aXRsZSk7XG4gICAgICAgIGl0ZW0uZGF0ZShkYXRlLmZvcm1hdChkYXRhLmRhdGUpKTtcbiAgICAgICAgaXRlbS5kZWJpdChkYXRhLmRlYml0KTtcbiAgICAgICAgaXRlbS5jcmVkaXQoZGF0YS5jcmVkaXQpO1xuICAgICAgICBpdGVtLmFtb3VudChtb25leS5mb3JtYXQoZGF0YS5hbW91bnQpKTtcbiAgICAgICAgaXRlbS5jdXJyZW5jeShkYXRhLmN1cnJlbmN5LnRvVXBwZXJDYXNlKCkpO1xuICAgICAgICBpdGVtLmV1cl9hbW91bnQobW9uZXkuZm9ybWF0KGRhdGEuZXVyX2Ftb3VudCkpO1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgICBpdGVtLmRhdGUoZGF0ZS5mb3JtYXQoTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCkpKTtcbiAgICB9XG5cbiAgICBpdGVtLnRvSlMgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICByZXR1cm4ge1xuXG4gICAgICAgICAgICB0aXRsZTogaXRlbS50aXRsZSgpLFxuICAgICAgICAgICAgZGF0ZTogZGF0ZS5wYXJzZShpdGVtLmRhdGUoKSksXG4gICAgICAgICAgICBkZWJpdDogaXRlbS5kZWJpdCgpLFxuICAgICAgICAgICAgY3JlZGl0OiBpdGVtLmNyZWRpdCgpLFxuICAgICAgICAgICAgYW1vdW50OiBtb25leS5wYXJzZShpdGVtLmFtb3VudCgpKSxcbiAgICAgICAgICAgIGN1cnJlbmN5OiBpdGVtLmN1cnJlbmN5KCkudG9Mb3dlckNhc2UoKSxcbiAgICAgICAgICAgIGV1cl9hbW91bnQ6IG1vbmV5LnBhcnNlKGl0ZW0uZXVyX2Ftb3VudCgpKVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICByZXR1cm4gaXRlbTtcbn07XG4iLCJ2YXIgWEhSID0gcmVxdWlyZSgnLi94aHInKTtcblxuZXhwb3J0cy5lbnRyeSA9IHtcblxuICAgIGZ1bGw6IGZ1bmN0aW9uKGlkKSB7XG5cbiAgICAgICAgcmV0dXJuIFhIUi5nZXQoJy9hcGkvZW50cnkvJyArIGlkICsgJy9mdWxsJyk7XG4gICAgfSxcblxuICAgIGdldDogZnVuY3Rpb24oaWQpIHtcblxuICAgICAgICByZXR1cm4gWEhSLmdldCgnL2FwaS9lbnRyeS8nICsgaWQpO1xuICAgIH0sXG5cbiAgICBsaXN0OiBmdW5jdGlvbihzdGFydCwgZW5kKSB7XG5cbiAgICAgICAgdmFyIHVybCA9ICcvYXBpL2VudHJpZXMvJyArIHN0YXJ0ICsgJy8nICsgZW5kO1xuXG4gICAgICAgIHJldHVybiBYSFIuZ2V0KHVybCk7XG4gICAgfSxcblxuICAgIHJlbW92ZTogZnVuY3Rpb24oaWQpIHtcblxuICAgICAgICByZXR1cm4gWEhSLmRlbGV0ZSgnL2FwaS9lbnRyeS8nICsgaWQpO1xuICAgIH0sXG5cbiAgICB1cGRhdGU6IGZ1bmN0aW9uKGlkLCBkYXRhKSB7XG5cbiAgICAgICAgcmV0dXJuIFhIUi5wdXQoJy9hcGkvZW50cnkvJyArIGlkLCBkYXRhKTtcbiAgICB9LFxuXG4gICAgc2F2ZTogZnVuY3Rpb24oZGF0YSkge1xuXG4gICAgICAgIHJldHVybiBYSFIucG9zdCgnL2FwaS9lbnRyeScsIGRhdGEpO1xuICAgIH1cbn07XG5cbmV4cG9ydHMuYWNjb3VudCA9IHtcblxuICAgIGFsbDogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgcmV0dXJuIFhIUi5nZXQoJy9hcGkvYWNjb3VudHMnKTtcbiAgICB9LFxuXG4gICAgaXRlbXM6IGZ1bmN0aW9uKGlkLCBzdGFydCwgZW5kKSB7XG5cbiAgICAgICAgdmFyIHVybCA9ICcvYXBpL2FjY291bnQvJyArIGlkICsgJy9pdGVtcy8nICtcbiAgICAgICAgICAgIHN0YXJ0ICsgJy8nICsgZW5kO1xuXG4gICAgICAgIHJldHVybiBYSFIuZ2V0KHVybCk7XG4gICAgfSxcblxuICAgIGdldDogZnVuY3Rpb24oaWQpIHtcblxuICAgICAgICByZXR1cm4gWEhSLmdldCgnL2FwaS9hY2NvdW50LycgKyBpZCk7XG4gICAgfSxcblxuICAgIHVwZGF0ZTogZnVuY3Rpb24oaWQsIGRhdGEpIHtcblxuICAgICAgICByZXR1cm4gWEhSLnB1dCgnL2FwaS9hY2NvdW50LycgKyBpZCwgZGF0YSk7XG4gICAgfSxcblxuICAgIHNhdmU6IGZ1bmN0aW9uKGRhdGEpIHtcblxuICAgICAgICByZXR1cm4gWEhSLnBvc3QoJy9hcGkvYWNjb3VudCcsIGRhdGEpO1xuICAgIH0sXG5cbiAgICByZW1vdmU6IGZ1bmN0aW9uKGlkKSB7XG5cbiAgICAgICAgcmV0dXJuIFhIUi5kZWxldGUoJy9hcGkvYWNjb3VudC8nICsgaWQpO1xuICAgIH1cbn07XG4iLCJleHBvcnRzLnBhcnNlID0gZnVuY3Rpb24odGV4dCkge1xuXG4gICAgdmFyIG1hdGNoID0gdGV4dC5tYXRjaCgvKFxcZHsyfSlcXC4oXFxkezJ9KVxcLihcXGR7NH0pLyk7XG5cbiAgICBpZiAobWF0Y2gpIHtcblxuICAgICAgICB2YXIgbW9udGhEYXRlID0gcGFyc2VJbnQobWF0Y2hbMV0sIDEwKTtcbiAgICAgICAgdmFyIG1vbnRoID0gcGFyc2VJbnQobWF0Y2hbMl0sIDEwKSAtIDE7XG4gICAgICAgIHZhciB5ZWFyID0gcGFyc2VJbnQobWF0Y2hbM10sIDEwKTtcblxuICAgICAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG5cbiAgICAgICAgZGF0ZS5zZXRVVENIb3VycygwLCAwLCAwLCAwKTtcbiAgICAgICAgZGF0ZS5zZXRVVENGdWxsWWVhcih5ZWFyLCBtb250aCwgbW9udGhEYXRlKTtcblxuICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihkYXRlLmdldFRpbWUoKSAvIDEwMDApO1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBwYXJzZSBkYXRlICcgKyB0ZXh0KTtcbiAgICB9XG59O1xuXG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKHVuaXgpIHtcblxuICAgIHZhciBkYXRlID0gbmV3IERhdGUodW5peCAqIDEwMDApO1xuXG4gICAgdmFyIHllYXIgPSBkYXRlLmdldFVUQ0Z1bGxZZWFyKCk7XG4gICAgdmFyIG1vbnRoID0gZGF0ZS5nZXRVVENNb250aCgpICsgMTtcbiAgICB2YXIgZGF5ID0gZGF0ZS5nZXRVVENEYXRlKCk7XG5cbiAgICBmdW5jdGlvbiBwYWQoeCkge1xuXG4gICAgICAgIHJldHVybiB4IDwgMTAgPyAnMCcgKyB4IDogJycgKyB4O1xuICAgIH1cblxuICAgIHJldHVybiBwYWQoZGF5KSArICcuJyArIHBhZChtb250aCkgKyAnLicgKyB5ZWFyO1xufTtcbiIsImV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbihzdHJpbmcpIHtcblxuICAgIHZhciBtYXRjaCA9IHN0cmluZy5tYXRjaCgvKFxcZCspKD86XFwuKFxcZHsyfSkpPy8pO1xuXG4gICAgaWYgKG1hdGNoKSB7XG5cbiAgICAgICAgdmFyIGludGVnZXJQYXJ0ID0gcGFyc2VJbnQobWF0Y2hbMV0sIDEwKTtcbiAgICAgICAgdmFyIGZyYWN0aW9uYWxQYXJ0ID0gMDtcblxuICAgICAgICBpZiAobWF0Y2hbMl0pIHtcblxuICAgICAgICAgICAgZnJhY3Rpb25hbFBhcnQgPSBwYXJzZUludChtYXRjaFsyXSwgMTApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGludGVnZXJQYXJ0ICogMTAwICsgZnJhY3Rpb25hbFBhcnQ7XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHBhcnNlICcgKyBzdHJpbmcpO1xuICAgIH1cbn07XG5cbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24odmFsdWUpIHtcblxuICAgIHZhciBuZWcgPSBmYWxzZTtcblxuICAgIGlmICh2YWx1ZSA8IDApIHtcblxuICAgICAgICBuZWcgPSB0cnVlO1xuICAgICAgICB2YWx1ZSA9IC12YWx1ZTtcbiAgICB9XG5cbiAgICB2YXIgaW50ZWdlclBhcnQgPSBNYXRoLmZsb29yKHZhbHVlIC8gMTAwKTtcbiAgICB2YXIgZnJhY3Rpb25hbFBhcnQgPSB2YWx1ZSAlIDEwMDtcblxuICAgIHJldHVybiAobmVnID8gJy0nIDogJycpICsgaW50ZWdlclBhcnQgKyAnLicgK1xuICAgICAgICAoKGZyYWN0aW9uYWxQYXJ0IDwgMTAgPyAnMCcgOiAnJykgKyBmcmFjdGlvbmFsUGFydCk7XG59O1xuIiwiZXhwb3J0cy5zdGFydF9tb250aCA9IGtvLm9ic2VydmFibGUoKTtcbmV4cG9ydHMuZW5kX21vbnRoID0ga28ub2JzZXJ2YWJsZSgpO1xuXG5leHBvcnRzLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgbW9udGggPSBleHBvcnRzLm1vbnRocy5pbmRleE9mKGV4cG9ydHMuc3RhcnRfbW9udGgoKSk7XG4gICAgdmFyIHllYXIgPSBwYXJzZUludChleHBvcnRzLnllYXIoKSwgMTApO1xuXG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuXG4gICAgZGF0ZS5zZXRVVENGdWxsWWVhcih5ZWFyLCBtb250aCwgMSk7XG4gICAgZGF0ZS5zZXRVVENIb3VycygwLCAwLCAwLCAwKTtcblxuICAgIHJldHVybiBNYXRoLmZsb29yKGRhdGUuZ2V0VGltZSgpIC8gMTAwMCk7XG59O1xuXG5leHBvcnRzLmVuZCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIG1vbnRoID0gZXhwb3J0cy5tb250aHMuaW5kZXhPZihleHBvcnRzLmVuZF9tb250aCgpKTtcbiAgICB2YXIgeWVhciA9IHBhcnNlSW50KGV4cG9ydHMueWVhcigpLCAxMCk7XG5cbiAgICBpZiAobW9udGggPT09IDExKSB7XG5cbiAgICAgICAgbW9udGggPSAwO1xuICAgICAgICB5ZWFyICs9IDE7XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICAgIG1vbnRoICs9IDE7XG4gICAgfVxuXG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuXG4gICAgZGF0ZS5zZXRVVENGdWxsWWVhcih5ZWFyLCBtb250aCwgMSk7XG4gICAgZGF0ZS5zZXRVVENIb3VycygwLCAwLCAwLCAwKTtcblxuICAgIC8vIE9uZSBkYXkgYmVmb3JlIHN0YXJ0IG9mIHRoZSBuZXh0IG1vbnRoLlxuXG4gICAgcmV0dXJuIE1hdGguZmxvb3IoZGF0ZS5nZXRUaW1lKCkgLyAxMDAwKSAtIDE7XG59O1xuXG5leHBvcnRzLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgcm91dGUucmVmcmVzaCgpO1xufTtcblxudmFyIGN1cnJlbnREYXRlID0gbmV3IERhdGUoKTtcbnZhciBjdXJyZW50WWVhciA9IGN1cnJlbnREYXRlLmdldFVUQ0Z1bGxZZWFyKCk7XG52YXIgY3VycmVudE1vbnRoID0gY3VycmVudERhdGUuZ2V0VVRDTW9udGgoKTtcblxuZXhwb3J0cy5tb250aHMgPSBbJ0phbnVhcnknLCAnRmVicnVhcnknLCAnTWFyY2gnLCAnQXByaWwnLCAnTWF5JywgJ0p1bmUnLFxuICAgICdKdWx5JywgJ0F1Z3VzdCcsICdTZXB0ZW1iZXInLCAnT2N0b2JlcicsICdOb3ZlbWJlcicsICdEZWNlbWJlciddO1xuXG5leHBvcnRzLnllYXIgPSBrby5vYnNlcnZhYmxlKGN1cnJlbnRZZWFyLnRvU3RyaW5nKCkpO1xuZXhwb3J0cy55ZWFycyA9IFtdO1xuXG5mb3IgKHZhciB5ID0gMjAxMjsgeSA8PSBjdXJyZW50WWVhciArIDE7IHkrKykge1xuXG4gICAgZXhwb3J0cy55ZWFycy5wdXNoKHkudG9TdHJpbmcoKSk7XG59XG5cbmV4cG9ydHMuc3RhcnRfbW9udGgoZXhwb3J0cy5tb250aHNbY3VycmVudE1vbnRoXSk7XG5leHBvcnRzLmVuZF9tb250aChleHBvcnRzLm1vbnRoc1tjdXJyZW50TW9udGhdKTtcblxucmV0dXJuIGV4cG9ydHM7XG4iLCJ2YXIgWEhSID0gcmVxdWlyZSgnLi94aHInKTtcblxuLy8gU2hvd3MgdGVtcGxhdGUgKGJ5IGlkKSB3aXRoIHRoZSBnaXZlbiBtb2RlbFxuXG5leHBvcnRzLnNob3cgPSBmdW5jdGlvbihpZCwgbW9kZWwpIHtcblxuICAgIHZhciBjb250ZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NvbnRlbnQnKTtcblxuICAgIGlmIChjb250ZW50LmNoaWxkcmVuLmxlbmd0aCA9PT0gMSkge1xuXG4gICAgICAgIC8vIFNvbWV0aGluZyB3YXMgcHJldmlvdXNseSBzaG93bixcbiAgICAgICAgLy8gcmVtb3ZlIGl0LlxuXG4gICAgICAgIGtvLnJlbW92ZU5vZGUoY29udGVudC5jaGlsZHJlblswXSk7XG4gICAgfVxuXG4gICAgLy8gTG9hZCB0ZW1wbGF0ZSwgdHVybiBpbnRvIERPTSwgYmluZCB3aXRoIEtub2Nrb3V0SlMuXG5cbiAgICByZXR1cm4gWEhSLnRlbXBsYXRlKCcvdGVtcGxhdGVzLycgKyBpZCArICcuaHRtbCcpLnRoZW4oZnVuY3Rpb24odGV4dCkge1xuXG4gICAgICAgIHZhciB3cmFwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgICAgICAgd3JhcC5pbm5lckhUTUwgPSB0ZXh0O1xuXG4gICAgICAgIGNvbnRlbnQuYXBwZW5kQ2hpbGQod3JhcCk7XG5cbiAgICAgICAga28uYXBwbHlCaW5kaW5ncyhtb2RlbCwgd3JhcCk7XG4gICAgfSk7XG59O1xuXG4vLyBTaG93cyBpbmZvcm1hdGlvbmFsIG1lc3NhZ2UuXG5cbmV4cG9ydHMubWVzc2FnZSA9IGZ1bmN0aW9uKHRleHQsIGNsYXp6KSB7XG5cbiAgICB2YXIgbWVzc2FnZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWVzc2FnZXMnKTtcblxuICAgIHZhciBtZXNzYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbiAgICB2YXIgcmVhbENsYXp6ID0gJ2FsZXJ0JztcblxuICAgIGlmIChjbGF6eikge1xuXG4gICAgICAgIHJlYWxDbGF6eiArPSAnICcgKyBjbGF6ejtcblxuICAgIH0gZWxzZSB7XG5cbiAgICAgICAgcmVhbENsYXp6ICs9ICcgYWxlcnQtc3VjY2Vzcyc7XG4gICAgfVxuXG4gICAgbWVzc2FnZS5jbGFzc05hbWUgPSByZWFsQ2xheno7XG4gICAgbWVzc2FnZS5pbm5lckhUTUwgPSB0ZXh0O1xuXG4gICAgbWVzc2FnZXMuYXBwZW5kQ2hpbGQobWVzc2FnZSk7XG5cbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIG1lc3NhZ2VzLnJlbW92ZUNoaWxkKG1lc3NhZ2UpO1xuXG4gICAgfSwgMjAwMCk7XG59O1xuIiwiZXhwb3J0cy5nZXQgPSBmdW5jdGlvbih1cmwpIHtcblxuICAgIHZhciBkZWZlcnJlZCA9IFEuZGVmZXIoKTtcblxuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIHhoci5vcGVuKCdHRVQnLCB1cmwsIHRydWUpO1xuXG4gICAgeGhyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbigpIHtcblxuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkuZGF0YSk7XG5cbiAgICB9LCBmYWxzZSk7XG5cbiAgICB4aHIuc2VuZCgpO1xuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG5leHBvcnRzLnBvc3QgPSBmdW5jdGlvbih1cmwsIGRhdGEpIHtcblxuICAgIHZhciBkZWZlcnJlZCA9IFEuZGVmZXIoKTtcblxuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIHhoci5vcGVuKCdQT1NUJywgdXJsLCB0cnVlKTtcblxuICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuXG4gICAgeGhyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbigpIHtcblxuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkuZGF0YSk7XG5cbiAgICB9LCBmYWxzZSk7XG5cbiAgICB4aHIuc2VuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbmV4cG9ydHMucHV0ID0gZnVuY3Rpb24odXJsLCBkYXRhKSB7XG5cbiAgICB2YXIgZGVmZXJyZWQgPSBRLmRlZmVyKCk7XG5cbiAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICB4aHIub3BlbignUFVUJywgdXJsLCB0cnVlKTtcblxuICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuXG4gICAgeGhyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbigpIHtcblxuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCkuZGF0YSk7XG5cbiAgICB9LCBmYWxzZSk7XG5cbiAgICB4aHIuc2VuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbmV4cG9ydHMuZGVsZXRlID0gZnVuY3Rpb24odXJsKSB7XG5cbiAgICB2YXIgZGVmZXJyZWQgPSBRLmRlZmVyKCk7XG5cbiAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICB4aHIub3BlbignREVMRVRFJywgdXJsLCB0cnVlKTtcblxuICAgIHhoci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgdmFyIG9iaiA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCk7XG5cbiAgICAgICAgaWYgKG9iai5zdGF0dXMgPT09IFwic3VjY2Vzc1wiKSB7XG5cbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUob2JqLmRhdGEpO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChvYmopO1xuICAgICAgICB9XG5cbiAgICB9LCBmYWxzZSk7XG5cbiAgICB4aHIuc2VuZCgpO1xuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG5leHBvcnRzLnRlbXBsYXRlID0gZnVuY3Rpb24odXJsKSB7XG5cbiAgICB2YXIgZGVmZXJyZWQgPSBRLmRlZmVyKCk7XG5cbiAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICB4aHIub3BlbignR0VUJywgdXJsLCB0cnVlKTtcblxuICAgIHhoci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh4aHIucmVzcG9uc2VUZXh0KTtcblxuICAgIH0sIGZhbHNlKTtcblxuICAgIHhoci5zZW5kKCk7XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbnJldHVybiBleHBvcnRzO1xuIl19
