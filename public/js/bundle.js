(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var cash = require('./controller/cash');
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

route(/^expanded/, function() {

    entry.expanded().done();
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

route(/^cash/, function() {

    cash.show().done();
});

route(/^help/, function() {

    view.show('help', {}).done();
});

route(/.*/, function() {

    route.go('entries');
});

var periodForm = document.getElementById('period');

ko.applyBindings(period, periodForm);

},{"./controller/account":2,"./controller/cash":3,"./controller/entry":4,"./lib/date":8,"./lib/money":9,"./lib/period":10,"./lib/view":11}],2:[function(require,module,exports){
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

},{"../lib/api":7,"../lib/period":10,"../lib/view":11,"./vm/account_vm":5}],3:[function(require,module,exports){
var api = require('../lib/api');
var view = require('../lib/view');
var period = require('../lib/period');

exports.show = function() {

    var start = period.start(), end = period.end();

    return api.cash.list(start, end).then(function(items) {

        var summary = {};
        var accounts = {};

        items.forEach(function(item) {

            var code = item.account.code;

            accounts[code] = item.account;

            summary[code] = (summary[code] || 0) + item.amount;
        });

        var sumList = Object.keys(summary).map(function(code) {

            return { account: accounts[code], amount: summary[code] };
        });

        return view.show('cash', { items: items, summary: sumList });
    });
};

},{"../lib/api":7,"../lib/period":10,"../lib/view":11}],4:[function(require,module,exports){
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

},{"../lib/api":7,"../lib/period":10,"../lib/view":11,"./vm/entry_vm":6}],5:[function(require,module,exports){
var view = require('../../lib/view');
var api = require('../../lib/api');

module.exports = function(data) {

    var account = {

        $id: null,
        code: ko.observable(),
        name: ko.observable(),
        type: ko.observable(),
        types: ['liability', 'income', 'equity',
            'asset', 'expense', 'cash', 'bank']
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

},{"../../lib/api":7,"../../lib/view":11}],6:[function(require,module,exports){
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

},{"../../lib/api":7,"../../lib/date":8,"../../lib/money":9,"../../lib/view":11}],7:[function(require,module,exports){
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

exports.cash = {

    list: function(start, end) {

        var url = '/api/cash/' + start + '/' + end;

        return XHR.get(url);
    }
};

},{"./xhr":12}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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

},{"./xhr":12}],12:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvdXNyL2xvY2FsL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL3JhaXZvL2V4cGVuc2VzMi9wdWJsaWMvanMvYXBwLmpzIiwiL2hvbWUvcmFpdm8vZXhwZW5zZXMyL3B1YmxpYy9qcy9jb250cm9sbGVyL2FjY291bnQuanMiLCIvaG9tZS9yYWl2by9leHBlbnNlczIvcHVibGljL2pzL2NvbnRyb2xsZXIvY2FzaC5qcyIsIi9ob21lL3JhaXZvL2V4cGVuc2VzMi9wdWJsaWMvanMvY29udHJvbGxlci9lbnRyeS5qcyIsIi9ob21lL3JhaXZvL2V4cGVuc2VzMi9wdWJsaWMvanMvY29udHJvbGxlci92bS9hY2NvdW50X3ZtLmpzIiwiL2hvbWUvcmFpdm8vZXhwZW5zZXMyL3B1YmxpYy9qcy9jb250cm9sbGVyL3ZtL2VudHJ5X3ZtLmpzIiwiL2hvbWUvcmFpdm8vZXhwZW5zZXMyL3B1YmxpYy9qcy9saWIvYXBpLmpzIiwiL2hvbWUvcmFpdm8vZXhwZW5zZXMyL3B1YmxpYy9qcy9saWIvZGF0ZS5qcyIsIi9ob21lL3JhaXZvL2V4cGVuc2VzMi9wdWJsaWMvanMvbGliL21vbmV5LmpzIiwiL2hvbWUvcmFpdm8vZXhwZW5zZXMyL3B1YmxpYy9qcy9saWIvcGVyaW9kLmpzIiwiL2hvbWUvcmFpdm8vZXhwZW5zZXMyL3B1YmxpYy9qcy9saWIvdmlldy5qcyIsIi9ob21lL3JhaXZvL2V4cGVuc2VzMi9wdWJsaWMvanMvbGliL3hoci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGNhc2ggPSByZXF1aXJlKCcuL2NvbnRyb2xsZXIvY2FzaCcpO1xudmFyIGVudHJ5ID0gcmVxdWlyZSgnLi9jb250cm9sbGVyL2VudHJ5Jyk7XG52YXIgYWNjb3VudCA9IHJlcXVpcmUoJy4vY29udHJvbGxlci9hY2NvdW50Jyk7XG52YXIgdmlldyA9IHJlcXVpcmUoJy4vbGliL3ZpZXcnKTtcbnZhciBwZXJpb2QgPSByZXF1aXJlKCcuL2xpYi9wZXJpb2QnKTtcbnZhciBtb25leSA9IHJlcXVpcmUoJy4vbGliL21vbmV5Jyk7XG52YXIgZGF0ZSA9IHJlcXVpcmUoJy4vbGliL2RhdGUnKTtcblxud2luZG93LmZvcm1hdERhdGUgPSBmdW5jdGlvbih1bml4KSB7XG5cbiAgICByZXR1cm4gZGF0ZS5mb3JtYXQodW5peCk7XG59XG5cbndpbmRvdy5mb3JtYXRBbW91bnQgPSBmdW5jdGlvbihhbW91bnQpIHtcblxuICAgIHJldHVybiBtb25leS5mb3JtYXQoYW1vdW50KTtcbn1cblxucm91dGUoL15lbnRyaWVzLywgZnVuY3Rpb24oKSB7XG5cbiAgICBlbnRyeS5saXN0KCkuZG9uZSgpO1xufSk7XG5cbnJvdXRlKC9eZXhwYW5kZWQvLCBmdW5jdGlvbigpIHtcblxuICAgIGVudHJ5LmV4cGFuZGVkKCkuZG9uZSgpO1xufSk7XG5cbnJvdXRlKC9eZW50cnlcXC9lZGl0XFwvKFthLXowLTlcXC1dKykvLCBmdW5jdGlvbihpZCkge1xuXG4gICAgZW50cnkuZWRpdChpZCkuZG9uZSgpO1xufSk7XG5cbnJvdXRlKC9eZW50cnlcXC92aWV3XFwvKFthLXowLTlcXC1dKykvLCBmdW5jdGlvbihpZCkge1xuXG4gICAgZW50cnkudmlldyhpZCkuZG9uZSgpO1xufSk7XG5cbnJvdXRlKC9eZW50cnlcXC9hZGQvLCBmdW5jdGlvbigpIHtcblxuICAgIGVudHJ5LmFkZCgpLmRvbmUoKTtcbn0pO1xuXG5yb3V0ZSgvXmFjY291bnRzLywgZnVuY3Rpb24oKSB7XG5cbiAgICBhY2NvdW50Lmxpc3QoKS5kb25lKCk7XG59KTtcblxucm91dGUoL15hY2NvdW50XFwvYWRkLywgZnVuY3Rpb24oKSB7XG5cbiAgICBhY2NvdW50LmFkZCgpLmRvbmUoKTtcbn0pO1xuXG5yb3V0ZSgvXmFjY291bnRcXC9lZGl0XFwvKC4rKS8sIGZ1bmN0aW9uKGlkKSB7XG5cbiAgICBhY2NvdW50LmVkaXQoaWQpLmRvbmUoKTtcbn0pO1xuXG5yb3V0ZSgvXmFjY291bnRcXC8oLispXFwvaXRlbXMvLCBmdW5jdGlvbihpZCkge1xuXG4gICAgYWNjb3VudC5pdGVtcyhpZCkuZG9uZSgpO1xufSk7XG5cbnJvdXRlKC9eY2FzaC8sIGZ1bmN0aW9uKCkge1xuXG4gICAgY2FzaC5zaG93KCkuZG9uZSgpO1xufSk7XG5cbnJvdXRlKC9eaGVscC8sIGZ1bmN0aW9uKCkge1xuXG4gICAgdmlldy5zaG93KCdoZWxwJywge30pLmRvbmUoKTtcbn0pO1xuXG5yb3V0ZSgvLiovLCBmdW5jdGlvbigpIHtcblxuICAgIHJvdXRlLmdvKCdlbnRyaWVzJyk7XG59KTtcblxudmFyIHBlcmlvZEZvcm0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGVyaW9kJyk7XG5cbmtvLmFwcGx5QmluZGluZ3MocGVyaW9kLCBwZXJpb2RGb3JtKTtcbiIsInZhciBhY2NvdW50Vk0gPSByZXF1aXJlKCcuL3ZtL2FjY291bnRfdm0nKTtcbnZhciBhcGkgPSByZXF1aXJlKCcuLi9saWIvYXBpJyk7XG52YXIgdmlldyA9IHJlcXVpcmUoJy4uL2xpYi92aWV3Jyk7XG52YXIgcGVyaW9kID0gcmVxdWlyZSgnLi4vbGliL3BlcmlvZCcpO1xuXG4vLyBTaG93cyB0aGUgbGlzdCBvZiBhY2NvdW50cy5cblxuZXhwb3J0cy5saXN0ID0gZnVuY3Rpb24oKSB7XG5cbiAgICByZXR1cm4gYXBpLmFjY291bnQuYWxsKCkudGhlbihmdW5jdGlvbihhY2NvdW50cykge1xuXG4gICAgICAgIHJldHVybiB2aWV3LnNob3coJ2FjY291bnRzJywgeyBhY2NvdW50czogYWNjb3VudHMgfSk7XG4gICAgfSk7XG59O1xuXG4vLyBTaG93cyBlbnRyeSBpdGVtcyBmb3IgdGhlIGdpdmVuIGFjY291bnQuXG5cbmV4cG9ydHMuaXRlbXMgPSBmdW5jdGlvbihpZCkge1xuXG4gICAgdmFyIHN0YXJ0ID0gcGVyaW9kLnN0YXJ0KCksIGVuZCA9IHBlcmlvZC5lbmQoKTtcblxuICAgIHJldHVybiBhcGkuYWNjb3VudC5pdGVtcyhpZCwgc3RhcnQsIGVuZCkudGhlbihmdW5jdGlvbihhY2NvdW50cykge1xuXG4gICAgICAgIHJldHVybiBhcGkuYWNjb3VudC5nZXQoaWQpLnRoZW4oZnVuY3Rpb24oYWNjb3VudCkge1xuXG4gICAgICAgICAgICB2YXIgdG90YWwgPSAwO1xuXG4gICAgICAgICAgICBhY2NvdW50cy5mb3JFYWNoKGZ1bmN0aW9uKGFjY291bnQpIHtcblxuICAgICAgICAgICAgICAgIHRvdGFsICs9IGFjY291bnQuZWZmZWN0O1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiB2aWV3LnNob3coJ2FjY291bnRfZW50cmllcycsIHtcblxuICAgICAgICAgICAgICAgIGFjY291bnRzOiBhY2NvdW50cyxcbiAgICAgICAgICAgICAgICBhY2NvdW50OiBhY2NvdW50LFxuICAgICAgICAgICAgICAgIHRvdGFsOiB0b3RhbFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuLy8gU2hvd3MgdGhlIG5ldyBhY2NvdW50IGZvcm0uXG5cbmV4cG9ydHMuYWRkID0gZnVuY3Rpb24oKSB7XG5cbiAgICByZXR1cm4gdmlldy5zaG93KCdhY2NvdW50JywgYWNjb3VudFZNKCkpO1xufTtcblxuLy8gU2hvd3MgdGhlIGFjY291bnQgZWRpdCBmb3JtIGZvciB0aGUgZ2l2ZW4gYWNjb3VudC5cblxuZXhwb3J0cy5lZGl0ID0gZnVuY3Rpb24oaWQpIHtcblxuICAgIHJldHVybiBhcGkuYWNjb3VudC5nZXQoaWQpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuXG4gICAgICAgIHJldHVybiB2aWV3LnNob3coJ2FjY291bnQnLCBhY2NvdW50Vk0oZGF0YSkpO1xuICAgIH0pO1xufTtcblxucmV0dXJuIGV4cG9ydHM7XG4iLCJ2YXIgYXBpID0gcmVxdWlyZSgnLi4vbGliL2FwaScpO1xudmFyIHZpZXcgPSByZXF1aXJlKCcuLi9saWIvdmlldycpO1xudmFyIHBlcmlvZCA9IHJlcXVpcmUoJy4uL2xpYi9wZXJpb2QnKTtcblxuZXhwb3J0cy5zaG93ID0gZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgc3RhcnQgPSBwZXJpb2Quc3RhcnQoKSwgZW5kID0gcGVyaW9kLmVuZCgpO1xuXG4gICAgcmV0dXJuIGFwaS5jYXNoLmxpc3Qoc3RhcnQsIGVuZCkudGhlbihmdW5jdGlvbihpdGVtcykge1xuXG4gICAgICAgIHZhciBzdW1tYXJ5ID0ge307XG4gICAgICAgIHZhciBhY2NvdW50cyA9IHt9O1xuXG4gICAgICAgIGl0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuXG4gICAgICAgICAgICB2YXIgY29kZSA9IGl0ZW0uYWNjb3VudC5jb2RlO1xuXG4gICAgICAgICAgICBhY2NvdW50c1tjb2RlXSA9IGl0ZW0uYWNjb3VudDtcblxuICAgICAgICAgICAgc3VtbWFyeVtjb2RlXSA9IChzdW1tYXJ5W2NvZGVdIHx8IDApICsgaXRlbS5hbW91bnQ7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBzdW1MaXN0ID0gT2JqZWN0LmtleXMoc3VtbWFyeSkubWFwKGZ1bmN0aW9uKGNvZGUpIHtcblxuICAgICAgICAgICAgcmV0dXJuIHsgYWNjb3VudDogYWNjb3VudHNbY29kZV0sIGFtb3VudDogc3VtbWFyeVtjb2RlXSB9O1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdmlldy5zaG93KCdjYXNoJywgeyBpdGVtczogaXRlbXMsIHN1bW1hcnk6IHN1bUxpc3QgfSk7XG4gICAgfSk7XG59O1xuIiwidmFyIGVudHJ5Vk0gPSByZXF1aXJlKCcuL3ZtL2VudHJ5X3ZtJyk7XG52YXIgYXBpID0gcmVxdWlyZSgnLi4vbGliL2FwaScpO1xudmFyIHZpZXcgPSByZXF1aXJlKCcuLi9saWIvdmlldycpO1xudmFyIHBlcmlvZCA9IHJlcXVpcmUoJy4uL2xpYi9wZXJpb2QnKTtcblxuLy8gU2hvd3Mgc2luZ2xlIGVudHJ5LlxuXG5leHBvcnRzLnZpZXcgPSBmdW5jdGlvbihpZCkge1xuXG4gICAgcmV0dXJuIGFwaS5lbnRyeS5mdWxsKGlkKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcblxuICAgICAgICBkYXRhLml0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuXG4gICAgICAgICAgICBpdGVtLmRlYml0ID0gZGF0YS5hY2NvdW50c1tpdGVtLmRlYml0XTtcbiAgICAgICAgICAgIGl0ZW0uY3JlZGl0ID0gZGF0YS5hY2NvdW50c1tpdGVtLmNyZWRpdF07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGRhdGEuY2hhbmdlcyA9IE9iamVjdC5rZXlzKGRhdGEuY2hhbmdlcykubWFwKGZ1bmN0aW9uKGtleSkge1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGFjY291bnQ6IGRhdGEuYWNjb3VudHNba2V5XSxcbiAgICAgICAgICAgICAgICBjaGFuZ2U6IGRhdGEuY2hhbmdlc1trZXldXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEhhbmRsZXIgZm9yIGNvcHlpbmcgdGhlIGVudHJ5LlxuXG4gICAgICAgIGRhdGEuY29weSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICBhcGkuZW50cnkuZ2V0KGlkKS50aGVuKGZ1bmN0aW9uKGVudHJ5KSB7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gYXBpLmFjY291bnQuYWxsKCkudGhlbihmdW5jdGlvbihhY2NvdW50cykge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFVuc2V0IGVudHJ5IGlkLlxuXG4gICAgICAgICAgICAgICAgICAgIGVudHJ5LiRpZCA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZpZXcuc2hvdygnZW50cnknLCBlbnRyeVZNKGFjY291bnRzLCBlbnRyeSkpLnRoZW4oZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCBmb2N1cyB0byB0aXRsZSBmaWVsZC5cblxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2VudHJ5LXRpdGxlJykuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0pLmRvbmUoKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gdmlldy5zaG93KCdlbnRyeV92aWV3JywgZGF0YSk7XG4gICAgfSk7XG59O1xuXG4vLyBTaG93cyB0aGUgbGlzdCBvZiBlbnRyaWVzLlxuXG5leHBvcnRzLmxpc3QgPSBmdW5jdGlvbigpIHtcblxuICAgIHZhciBzdGFydCA9IHBlcmlvZC5zdGFydCgpLCBlbmQgPSBwZXJpb2QuZW5kKCk7XG5cbiAgICByZXR1cm4gYXBpLmVudHJ5Lmxpc3Qoc3RhcnQsIGVuZCkudGhlbihmdW5jdGlvbihlbnRyaWVzKSB7XG5cbiAgICAgICAgcmV0dXJuIHZpZXcuc2hvdygnZW50cmllcycsIHsgZW50cmllczogZW50cmllcyB9KTtcbiAgICB9KTtcbn07XG5cbi8vIFNob3dzIHRoZSBsaXN0IG9mIGV4cGFuZGVkIGVudHJpZXMuXG5cbmV4cG9ydHMuZXhwYW5kZWQgPSBmdW5jdGlvbigpIHtcblxuICAgIHZhciBzdGFydCA9IHBlcmlvZC5zdGFydCgpLCBlbmQgPSBwZXJpb2QuZW5kKCk7XG5cbiAgICByZXR1cm4gYXBpLmVudHJ5Lmxpc3Qoc3RhcnQsIGVuZCkudGhlbihmdW5jdGlvbihlbnRyaWVzKSB7XG5cbiAgICAgICAgcmV0dXJuIGFwaS5hY2NvdW50LmFsbCgpLnRoZW4oZnVuY3Rpb24oYWNjb3VudHMpIHtcblxuICAgICAgICAgICAgdmFyIG1hcCA9IHt9O1xuXG4gICAgICAgICAgICBhY2NvdW50cy5mb3JFYWNoKGZ1bmN0aW9uKGFjY291bnQpIHtcblxuICAgICAgICAgICAgICAgIG1hcFthY2NvdW50LiRpZF0gPSBhY2NvdW50O1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGVudHJpZXMuZm9yRWFjaChmdW5jdGlvbihlbnRyeSkge1xuXG4gICAgICAgICAgICAgICAgZW50cnkuaXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaXRlbS5kZWJpdCA9IG1hcFtpdGVtLmRlYml0XTtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5jcmVkaXQgPSBtYXBbaXRlbS5jcmVkaXRdO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHZpZXcuc2hvdygnZXhwYW5kZWQnLCB7IGVudHJpZXM6IGVudHJpZXMgfSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuLy8gU2hvd3MgdGhlIGVkaXQgZm9ybSBmb3IgdGhlIGVudHJ5LlxuXG5leHBvcnRzLmVkaXQgPSBmdW5jdGlvbihpZCkge1xuXG4gICAgcmV0dXJuIGFwaS5lbnRyeS5nZXQoaWQpLnRoZW4oZnVuY3Rpb24oZW50cnkpIHtcblxuICAgICAgICByZXR1cm4gYXBpLmFjY291bnQuYWxsKCkudGhlbihmdW5jdGlvbihhY2NvdW50cykge1xuXG4gICAgICAgICAgICByZXR1cm4gdmlldy5zaG93KCdlbnRyeScsIGVudHJ5Vk0oYWNjb3VudHMsIGVudHJ5KSkudGhlbihmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdlbnRyeS10aXRsZScpLmZvY3VzKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG4vLyBTaG93cyB0aGUgZWRpdCBmb3JtIGZvciBhZGRpbmcgYSBuZXcgZW50cnkuXG5cbmV4cG9ydHMuYWRkID0gZnVuY3Rpb24oaWQpIHtcblxuICAgIHJldHVybiBhcGkuYWNjb3VudC5hbGwoKS50aGVuKGZ1bmN0aW9uKGFjY291bnRzKSB7XG5cbiAgICAgICAgcmV0dXJuIHZpZXcuc2hvdygnZW50cnknLCBlbnRyeVZNKGFjY291bnRzKSkudGhlbihmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2VudHJ5LXRpdGxlJykuZm9jdXMoKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuIiwidmFyIHZpZXcgPSByZXF1aXJlKCcuLi8uLi9saWIvdmlldycpO1xudmFyIGFwaSA9IHJlcXVpcmUoJy4uLy4uL2xpYi9hcGknKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihkYXRhKSB7XG5cbiAgICB2YXIgYWNjb3VudCA9IHtcblxuICAgICAgICAkaWQ6IG51bGwsXG4gICAgICAgIGNvZGU6IGtvLm9ic2VydmFibGUoKSxcbiAgICAgICAgbmFtZToga28ub2JzZXJ2YWJsZSgpLFxuICAgICAgICB0eXBlOiBrby5vYnNlcnZhYmxlKCksXG4gICAgICAgIHR5cGVzOiBbJ2xpYWJpbGl0eScsICdpbmNvbWUnLCAnZXF1aXR5JyxcbiAgICAgICAgICAgICdhc3NldCcsICdleHBlbnNlJywgJ2Nhc2gnLCAnYmFuayddXG4gICAgfVxuXG4gICAgaWYgKGRhdGEpIHtcblxuICAgICAgICBhY2NvdW50LiRpZCA9IGRhdGEuJGlkO1xuICAgICAgICBhY2NvdW50LmNvZGUoZGF0YS5jb2RlKTtcbiAgICAgICAgYWNjb3VudC5uYW1lKGRhdGEubmFtZSk7XG4gICAgICAgIGFjY291bnQudHlwZShkYXRhLnR5cGUpO1xuICAgIH1cblxuICAgIGFjY291bnQudG9KUyA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHJldHVybiB7XG5cbiAgICAgICAgICAgIGNvZGU6IGFjY291bnQuY29kZSgpLFxuICAgICAgICAgICAgbmFtZTogYWNjb3VudC5uYW1lKCksXG4gICAgICAgICAgICB0eXBlOiBhY2NvdW50LnR5cGUoKVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICBhY2NvdW50LnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgcmV0dXJuIGFjY291bnQuY29kZSgpICsgJyAoJyArIGFjY291bnQubmFtZSgpICsgJyknO1xuICAgIH07XG5cbiAgICBhY2NvdW50LnNhdmUgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICBpZiAoYWNjb3VudC4kaWQpIHtcblxuICAgICAgICAgICAgYXBpLmFjY291bnQudXBkYXRlKGFjY291bnQuJGlkLCBhY2NvdW50LnRvSlMoKSkuZG9uZShmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gJyNhY2NvdW50cyc7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICBhcGkuYWNjb3VudC5zYXZlKGFjY291bnQudG9KUygpKS5kb25lKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSAnI2FjY291bnRzJztcblxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICB2aWV3Lm1lc3NhZ2UoJ0FjY291bnQgaXMgc2F2ZWQuJyk7XG4gICAgfTtcblxuICAgIGFjY291bnQucmVtb3ZlID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgaWYgKGFjY291bnQuJGlkKSB7XG5cbiAgICAgICAgICAgIGlmIChjb25maXJtKCdEZWxldGUgdGhlIGFjY291bnQ/JykpIHtcblxuICAgICAgICAgICAgICAgIGFwaS5hY2NvdW50LnJlbW92ZShhY2NvdW50LiRpZCkudGhlbihmdW5jdGlvbihyZXNwb25zZSkge1xuXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gJyNhY2NvdW50cyc7XG5cbiAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcblxuICAgICAgICAgICAgICAgICAgICB2aWV3Lm1lc3NhZ2UoJ0Nhbm5vdCBkZWxldGUgdGhlIGFjY291bnQuICcgKyBlcnIubWVzc2FnZSwgJ2FsZXJ0LWRhbmdlcicpO1xuXG4gICAgICAgICAgICAgICAgfSkuZG9uZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBhY2NvdW50O1xufVxuIiwidmFyIG1vbmV5ID0gcmVxdWlyZSgnLi4vLi4vbGliL21vbmV5Jyk7XG52YXIgZGF0ZSA9IHJlcXVpcmUoJy4uLy4uL2xpYi9kYXRlJyk7XG52YXIgdmlldyA9IHJlcXVpcmUoJy4uLy4uL2xpYi92aWV3Jyk7XG52YXIgYXBpID0gcmVxdWlyZSgnLi4vLi4vbGliL2FwaScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFjY291bnRzLCBkYXRhKSB7XG5cbiAgICB2YXIgZW50cnkgPSB7XG5cbiAgICAgICAgdGl0bGU6IGtvLm9ic2VydmFibGUoKSxcbiAgICAgICAgJGlkOiBudWxsLFxuICAgICAgICBpdGVtczoga28ub2JzZXJ2YWJsZUFycmF5KFtdKSxcbiAgICAgICAgYWNjb3VudHM6IGFjY291bnRzLFxuICAgICAgICBjdXJyZW5jaWVzOiBbJ0VVUicsICdVU0QnLCAnR0JQJ11cbiAgICB9O1xuXG4gICAgaWYgKGRhdGEpIHtcblxuICAgICAgICBlbnRyeS4kaWQgPSBkYXRhLiRpZDtcbiAgICAgICAgZW50cnkudGl0bGUoZGF0YS50aXRsZSk7XG5cbiAgICAgICAgZGF0YS5pdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcblxuICAgICAgICAgICAgZW50cnkuaXRlbXMucHVzaChpdGVtVk0oaXRlbSkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBlbnRyeS50b0pTID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgcmV0dXJuIHtcblxuICAgICAgICAgICAgdGl0bGU6IGVudHJ5LnRpdGxlKCksXG4gICAgICAgICAgICBpdGVtczogZW50cnkuaXRlbXMoKS5tYXAoZnVuY3Rpb24oaXRlbSkge1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW0udG9KUygpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgZW50cnkuYWNjb3VudFRleHQgPSBmdW5jdGlvbihhY2NvdW50KSB7XG5cbiAgICAgICAgcmV0dXJuIGFjY291bnQuY29kZSArICcgKCcgKyBhY2NvdW50Lm5hbWUgKyAnKSc7XG4gICAgfTtcblxuICAgIGVudHJ5LmFjY291bnRWYWx1ZSA9IGZ1bmN0aW9uKGFjY291bnQpIHtcblxuICAgICAgICByZXR1cm4gYWNjb3VudC4kaWQ7XG4gICAgfTtcblxuICAgIGVudHJ5LnNhdmUgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICBpZiAoZW50cnkuJGlkKSB7XG5cbiAgICAgICAgICAgIGFwaS5lbnRyeS51cGRhdGUoZW50cnkuJGlkLCBlbnRyeS50b0pTKCkpLmRvbmUoZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaGFzaCA9ICcjZW50cnkvdmlldy8nICsgZW50cnkuJGlkO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgYXBpLmVudHJ5LnNhdmUoZW50cnkudG9KUygpKS5kb25lKGZ1bmN0aW9uKGRhdGEpIHtcblxuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gJyNlbnRyeS92aWV3LycgKyBkYXRhO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICB2aWV3Lm1lc3NhZ2UoJ1RoZSBlbnRyeSBpcyBzYXZlZC4nKTtcbiAgICB9O1xuXG4gICAgZW50cnkucmVtb3ZlID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgaWYgKGVudHJ5LiRpZCkge1xuXG4gICAgICAgICAgICBpZiAoY29uZmlybSgnUmVtb3ZlIHRoZSBlbnRyeT8nKSkge1xuXG4gICAgICAgICAgICAgICAgYXBpLmVudHJ5LnJlbW92ZShlbnRyeS4kaWQpLmRvbmUoZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSAnI2VudHJpZXMnO1xuXG4gICAgICAgICAgICAgICAgICAgIHZpZXcubWVzc2FnZSgnVGhlIGVudHJ5IGlzIGRlbGV0ZWQuJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZW50cnkuYWRkSXRlbSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGVudHJ5Lml0ZW1zLnB1c2goaXRlbVZNKCkpO1xuICAgIH07XG5cbiAgICBlbnRyeS5yZW1vdmVJdGVtID0gZnVuY3Rpb24oaXRlbSkge1xuXG4gICAgICAgIGlmIChjb25maXJtKCdSZW1vdmUgdGhlIGl0ZW0gJyArIGl0ZW0udGl0bGUoKSArICc/JykpIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZW50cnkuaXRlbXMucmVtb3ZlKGl0ZW0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBlbnRyeTtcbn1cblxuZnVuY3Rpb24gaXRlbVZNKGRhdGEpIHtcblxuICAgIHZhciBpdGVtID0ge1xuXG4gICAgICAgIHRpdGxlOiBrby5vYnNlcnZhYmxlKCksXG4gICAgICAgIGRhdGU6IGtvLm9ic2VydmFibGUoKSxcbiAgICAgICAgZGViaXQ6IGtvLm9ic2VydmFibGUoKSxcbiAgICAgICAgY3JlZGl0OiBrby5vYnNlcnZhYmxlKCksXG4gICAgICAgIGN1cnJlbmN5OiBrby5vYnNlcnZhYmxlKCksXG4gICAgICAgIGFtb3VudDoga28ub2JzZXJ2YWJsZSgpLFxuICAgICAgICBldXJfYW1vdW50OiBrby5vYnNlcnZhYmxlKClcbiAgICB9O1xuXG4gICAgaXRlbS5ldXJfb3JpZyA9IGtvLmNvbXB1dGVkKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBhbW91bnQgPSBpdGVtLmFtb3VudCgpO1xuICAgICAgICB2YXIgY3VycmVuY3kgPSBpdGVtLmN1cnJlbmN5KCk7XG5cbiAgICAgICAgaWYgKGFtb3VudCAmJiBjdXJyZW5jeSA9PT0gJ0VVUicpIHtcblxuICAgICAgICAgICAgcmV0dXJuIGFtb3VudDtcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICBpdGVtLmV1cl9vcmlnLnN1YnNjcmliZShmdW5jdGlvbih2YWx1ZSkge1xuXG4gICAgICAgIGlmICh2YWx1ZSkge1xuXG4gICAgICAgICAgICBpdGVtLmV1cl9hbW91bnQodmFsdWUpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAoZGF0YSkge1xuXG4gICAgICAgIGl0ZW0udGl0bGUoZGF0YS50aXRsZSk7XG4gICAgICAgIGl0ZW0uZGF0ZShkYXRlLmZvcm1hdChkYXRhLmRhdGUpKTtcbiAgICAgICAgaXRlbS5kZWJpdChkYXRhLmRlYml0KTtcbiAgICAgICAgaXRlbS5jcmVkaXQoZGF0YS5jcmVkaXQpO1xuICAgICAgICBpdGVtLmFtb3VudChtb25leS5mb3JtYXQoZGF0YS5hbW91bnQpKTtcbiAgICAgICAgaXRlbS5jdXJyZW5jeShkYXRhLmN1cnJlbmN5LnRvVXBwZXJDYXNlKCkpO1xuICAgICAgICBpdGVtLmV1cl9hbW91bnQobW9uZXkuZm9ybWF0KGRhdGEuZXVyX2Ftb3VudCkpO1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgICBpdGVtLmRhdGUoZGF0ZS5mb3JtYXQoTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCkpKTtcbiAgICB9XG5cbiAgICBpdGVtLnRvSlMgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICByZXR1cm4ge1xuXG4gICAgICAgICAgICB0aXRsZTogaXRlbS50aXRsZSgpLFxuICAgICAgICAgICAgZGF0ZTogZGF0ZS5wYXJzZShpdGVtLmRhdGUoKSksXG4gICAgICAgICAgICBkZWJpdDogaXRlbS5kZWJpdCgpLFxuICAgICAgICAgICAgY3JlZGl0OiBpdGVtLmNyZWRpdCgpLFxuICAgICAgICAgICAgYW1vdW50OiBtb25leS5wYXJzZShpdGVtLmFtb3VudCgpKSxcbiAgICAgICAgICAgIGN1cnJlbmN5OiBpdGVtLmN1cnJlbmN5KCkudG9Mb3dlckNhc2UoKSxcbiAgICAgICAgICAgIGV1cl9hbW91bnQ6IG1vbmV5LnBhcnNlKGl0ZW0uZXVyX2Ftb3VudCgpKVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICByZXR1cm4gaXRlbTtcbn07XG4iLCJ2YXIgWEhSID0gcmVxdWlyZSgnLi94aHInKTtcblxuZXhwb3J0cy5lbnRyeSA9IHtcblxuICAgIGZ1bGw6IGZ1bmN0aW9uKGlkKSB7XG5cbiAgICAgICAgcmV0dXJuIFhIUi5nZXQoJy9hcGkvZW50cnkvJyArIGlkICsgJy9mdWxsJyk7XG4gICAgfSxcblxuICAgIGdldDogZnVuY3Rpb24oaWQpIHtcblxuICAgICAgICByZXR1cm4gWEhSLmdldCgnL2FwaS9lbnRyeS8nICsgaWQpO1xuICAgIH0sXG5cbiAgICBsaXN0OiBmdW5jdGlvbihzdGFydCwgZW5kKSB7XG5cbiAgICAgICAgdmFyIHVybCA9ICcvYXBpL2VudHJpZXMvJyArIHN0YXJ0ICsgJy8nICsgZW5kO1xuXG4gICAgICAgIHJldHVybiBYSFIuZ2V0KHVybCk7XG4gICAgfSxcblxuICAgIHJlbW92ZTogZnVuY3Rpb24oaWQpIHtcblxuICAgICAgICByZXR1cm4gWEhSLmRlbGV0ZSgnL2FwaS9lbnRyeS8nICsgaWQpO1xuICAgIH0sXG5cbiAgICB1cGRhdGU6IGZ1bmN0aW9uKGlkLCBkYXRhKSB7XG5cbiAgICAgICAgcmV0dXJuIFhIUi5wdXQoJy9hcGkvZW50cnkvJyArIGlkLCBkYXRhKTtcbiAgICB9LFxuXG4gICAgc2F2ZTogZnVuY3Rpb24oZGF0YSkge1xuXG4gICAgICAgIHJldHVybiBYSFIucG9zdCgnL2FwaS9lbnRyeScsIGRhdGEpO1xuICAgIH1cbn07XG5cbmV4cG9ydHMuYWNjb3VudCA9IHtcblxuICAgIGFsbDogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgcmV0dXJuIFhIUi5nZXQoJy9hcGkvYWNjb3VudHMnKTtcbiAgICB9LFxuXG4gICAgaXRlbXM6IGZ1bmN0aW9uKGlkLCBzdGFydCwgZW5kKSB7XG5cbiAgICAgICAgdmFyIHVybCA9ICcvYXBpL2FjY291bnQvJyArIGlkICsgJy9pdGVtcy8nICtcbiAgICAgICAgICAgIHN0YXJ0ICsgJy8nICsgZW5kO1xuXG4gICAgICAgIHJldHVybiBYSFIuZ2V0KHVybCk7XG4gICAgfSxcblxuICAgIGdldDogZnVuY3Rpb24oaWQpIHtcblxuICAgICAgICByZXR1cm4gWEhSLmdldCgnL2FwaS9hY2NvdW50LycgKyBpZCk7XG4gICAgfSxcblxuICAgIHVwZGF0ZTogZnVuY3Rpb24oaWQsIGRhdGEpIHtcblxuICAgICAgICByZXR1cm4gWEhSLnB1dCgnL2FwaS9hY2NvdW50LycgKyBpZCwgZGF0YSk7XG4gICAgfSxcblxuICAgIHNhdmU6IGZ1bmN0aW9uKGRhdGEpIHtcblxuICAgICAgICByZXR1cm4gWEhSLnBvc3QoJy9hcGkvYWNjb3VudCcsIGRhdGEpO1xuICAgIH0sXG5cbiAgICByZW1vdmU6IGZ1bmN0aW9uKGlkKSB7XG5cbiAgICAgICAgcmV0dXJuIFhIUi5kZWxldGUoJy9hcGkvYWNjb3VudC8nICsgaWQpO1xuICAgIH1cbn07XG5cbmV4cG9ydHMuY2FzaCA9IHtcblxuICAgIGxpc3Q6IGZ1bmN0aW9uKHN0YXJ0LCBlbmQpIHtcblxuICAgICAgICB2YXIgdXJsID0gJy9hcGkvY2FzaC8nICsgc3RhcnQgKyAnLycgKyBlbmQ7XG5cbiAgICAgICAgcmV0dXJuIFhIUi5nZXQodXJsKTtcbiAgICB9XG59O1xuIiwiZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uKHRleHQpIHtcblxuICAgIHZhciBtYXRjaCA9IHRleHQubWF0Y2goLyhcXGR7Mn0pXFwuKFxcZHsyfSlcXC4oXFxkezR9KS8pO1xuXG4gICAgaWYgKG1hdGNoKSB7XG5cbiAgICAgICAgdmFyIG1vbnRoRGF0ZSA9IHBhcnNlSW50KG1hdGNoWzFdLCAxMCk7XG4gICAgICAgIHZhciBtb250aCA9IHBhcnNlSW50KG1hdGNoWzJdLCAxMCkgLSAxO1xuICAgICAgICB2YXIgeWVhciA9IHBhcnNlSW50KG1hdGNoWzNdLCAxMCk7XG5cbiAgICAgICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuXG4gICAgICAgIGRhdGUuc2V0VVRDSG91cnMoMCwgMCwgMCwgMCk7XG4gICAgICAgIGRhdGUuc2V0VVRDRnVsbFllYXIoeWVhciwgbW9udGgsIG1vbnRoRGF0ZSk7XG5cbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoZGF0ZS5nZXRUaW1lKCkgLyAxMDAwKTtcblxuICAgIH0gZWxzZSB7XG5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgcGFyc2UgZGF0ZSAnICsgdGV4dCk7XG4gICAgfVxufTtcblxuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbih1bml4KSB7XG5cbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKHVuaXggKiAxMDAwKTtcblxuICAgIHZhciB5ZWFyID0gZGF0ZS5nZXRVVENGdWxsWWVhcigpO1xuICAgIHZhciBtb250aCA9IGRhdGUuZ2V0VVRDTW9udGgoKSArIDE7XG4gICAgdmFyIGRheSA9IGRhdGUuZ2V0VVRDRGF0ZSgpO1xuXG4gICAgZnVuY3Rpb24gcGFkKHgpIHtcblxuICAgICAgICByZXR1cm4geCA8IDEwID8gJzAnICsgeCA6ICcnICsgeDtcbiAgICB9XG5cbiAgICByZXR1cm4gcGFkKGRheSkgKyAnLicgKyBwYWQobW9udGgpICsgJy4nICsgeWVhcjtcbn07XG4iLCJleHBvcnRzLnBhcnNlID0gZnVuY3Rpb24oc3RyaW5nKSB7XG5cbiAgICB2YXIgbWF0Y2ggPSBzdHJpbmcubWF0Y2goLyhcXGQrKSg/OlxcLihcXGR7Mn0pKT8vKTtcblxuICAgIGlmIChtYXRjaCkge1xuXG4gICAgICAgIHZhciBpbnRlZ2VyUGFydCA9IHBhcnNlSW50KG1hdGNoWzFdLCAxMCk7XG4gICAgICAgIHZhciBmcmFjdGlvbmFsUGFydCA9IDA7XG5cbiAgICAgICAgaWYgKG1hdGNoWzJdKSB7XG5cbiAgICAgICAgICAgIGZyYWN0aW9uYWxQYXJ0ID0gcGFyc2VJbnQobWF0Y2hbMl0sIDEwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpbnRlZ2VyUGFydCAqIDEwMCArIGZyYWN0aW9uYWxQYXJ0O1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBwYXJzZSAnICsgc3RyaW5nKTtcbiAgICB9XG59O1xuXG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cbiAgICB2YXIgbmVnID0gZmFsc2U7XG5cbiAgICBpZiAodmFsdWUgPCAwKSB7XG5cbiAgICAgICAgbmVnID0gdHJ1ZTtcbiAgICAgICAgdmFsdWUgPSAtdmFsdWU7XG4gICAgfVxuXG4gICAgdmFyIGludGVnZXJQYXJ0ID0gTWF0aC5mbG9vcih2YWx1ZSAvIDEwMCk7XG4gICAgdmFyIGZyYWN0aW9uYWxQYXJ0ID0gdmFsdWUgJSAxMDA7XG5cbiAgICByZXR1cm4gKG5lZyA/ICctJyA6ICcnKSArIGludGVnZXJQYXJ0ICsgJy4nICtcbiAgICAgICAgKChmcmFjdGlvbmFsUGFydCA8IDEwID8gJzAnIDogJycpICsgZnJhY3Rpb25hbFBhcnQpO1xufTtcbiIsImV4cG9ydHMuc3RhcnRfbW9udGggPSBrby5vYnNlcnZhYmxlKCk7XG5leHBvcnRzLmVuZF9tb250aCA9IGtvLm9ic2VydmFibGUoKTtcblxuZXhwb3J0cy5zdGFydCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIG1vbnRoID0gZXhwb3J0cy5tb250aHMuaW5kZXhPZihleHBvcnRzLnN0YXJ0X21vbnRoKCkpO1xuICAgIHZhciB5ZWFyID0gcGFyc2VJbnQoZXhwb3J0cy55ZWFyKCksIDEwKTtcblxuICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcblxuICAgIGRhdGUuc2V0VVRDRnVsbFllYXIoeWVhciwgbW9udGgsIDEpO1xuICAgIGRhdGUuc2V0VVRDSG91cnMoMCwgMCwgMCwgMCk7XG5cbiAgICByZXR1cm4gTWF0aC5mbG9vcihkYXRlLmdldFRpbWUoKSAvIDEwMDApO1xufTtcblxuZXhwb3J0cy5lbmQgPSBmdW5jdGlvbigpIHtcblxuICAgIHZhciBtb250aCA9IGV4cG9ydHMubW9udGhzLmluZGV4T2YoZXhwb3J0cy5lbmRfbW9udGgoKSk7XG4gICAgdmFyIHllYXIgPSBwYXJzZUludChleHBvcnRzLnllYXIoKSwgMTApO1xuXG4gICAgaWYgKG1vbnRoID09PSAxMSkge1xuXG4gICAgICAgIG1vbnRoID0gMDtcbiAgICAgICAgeWVhciArPSAxO1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgICBtb250aCArPSAxO1xuICAgIH1cblxuICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcblxuICAgIGRhdGUuc2V0VVRDRnVsbFllYXIoeWVhciwgbW9udGgsIDEpO1xuICAgIGRhdGUuc2V0VVRDSG91cnMoMCwgMCwgMCwgMCk7XG5cbiAgICAvLyBPbmUgZGF5IGJlZm9yZSBzdGFydCBvZiB0aGUgbmV4dCBtb250aC5cblxuICAgIHJldHVybiBNYXRoLmZsb29yKGRhdGUuZ2V0VGltZSgpIC8gMTAwMCkgLSAxO1xufTtcblxuZXhwb3J0cy51cGRhdGUgPSBmdW5jdGlvbigpIHtcblxuICAgIHJvdXRlLnJlZnJlc2goKTtcbn07XG5cbnZhciBjdXJyZW50RGF0ZSA9IG5ldyBEYXRlKCk7XG52YXIgY3VycmVudFllYXIgPSBjdXJyZW50RGF0ZS5nZXRVVENGdWxsWWVhcigpO1xudmFyIGN1cnJlbnRNb250aCA9IGN1cnJlbnREYXRlLmdldFVUQ01vbnRoKCk7XG5cbmV4cG9ydHMubW9udGhzID0gWydKYW51YXJ5JywgJ0ZlYnJ1YXJ5JywgJ01hcmNoJywgJ0FwcmlsJywgJ01heScsICdKdW5lJyxcbiAgICAnSnVseScsICdBdWd1c3QnLCAnU2VwdGVtYmVyJywgJ09jdG9iZXInLCAnTm92ZW1iZXInLCAnRGVjZW1iZXInXTtcblxuZXhwb3J0cy55ZWFyID0ga28ub2JzZXJ2YWJsZShjdXJyZW50WWVhci50b1N0cmluZygpKTtcbmV4cG9ydHMueWVhcnMgPSBbXTtcblxuZm9yICh2YXIgeSA9IDIwMTI7IHkgPD0gY3VycmVudFllYXIgKyAxOyB5KyspIHtcblxuICAgIGV4cG9ydHMueWVhcnMucHVzaCh5LnRvU3RyaW5nKCkpO1xufVxuXG5leHBvcnRzLnN0YXJ0X21vbnRoKGV4cG9ydHMubW9udGhzW2N1cnJlbnRNb250aF0pO1xuZXhwb3J0cy5lbmRfbW9udGgoZXhwb3J0cy5tb250aHNbY3VycmVudE1vbnRoXSk7XG5cbnJldHVybiBleHBvcnRzO1xuIiwidmFyIFhIUiA9IHJlcXVpcmUoJy4veGhyJyk7XG5cbi8vIFNob3dzIHRlbXBsYXRlIChieSBpZCkgd2l0aCB0aGUgZ2l2ZW4gbW9kZWxcblxuZXhwb3J0cy5zaG93ID0gZnVuY3Rpb24oaWQsIG1vZGVsKSB7XG5cbiAgICB2YXIgY29udGVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjb250ZW50Jyk7XG5cbiAgICBpZiAoY29udGVudC5jaGlsZHJlbi5sZW5ndGggPT09IDEpIHtcblxuICAgICAgICAvLyBTb21ldGhpbmcgd2FzIHByZXZpb3VzbHkgc2hvd24sXG4gICAgICAgIC8vIHJlbW92ZSBpdC5cblxuICAgICAgICBrby5yZW1vdmVOb2RlKGNvbnRlbnQuY2hpbGRyZW5bMF0pO1xuICAgIH1cblxuICAgIC8vIExvYWQgdGVtcGxhdGUsIHR1cm4gaW50byBET00sIGJpbmQgd2l0aCBLbm9ja291dEpTLlxuXG4gICAgcmV0dXJuIFhIUi50ZW1wbGF0ZSgnL3RlbXBsYXRlcy8nICsgaWQgKyAnLmh0bWwnKS50aGVuKGZ1bmN0aW9uKHRleHQpIHtcblxuICAgICAgICB2YXIgd3JhcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gICAgICAgIHdyYXAuaW5uZXJIVE1MID0gdGV4dDtcblxuICAgICAgICBjb250ZW50LmFwcGVuZENoaWxkKHdyYXApO1xuXG4gICAgICAgIGtvLmFwcGx5QmluZGluZ3MobW9kZWwsIHdyYXApO1xuICAgIH0pO1xufTtcblxuLy8gU2hvd3MgaW5mb3JtYXRpb25hbCBtZXNzYWdlLlxuXG5leHBvcnRzLm1lc3NhZ2UgPSBmdW5jdGlvbih0ZXh0LCBjbGF6eikge1xuXG4gICAgdmFyIG1lc3NhZ2VzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21lc3NhZ2VzJyk7XG5cbiAgICB2YXIgbWVzc2FnZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gICAgdmFyIHJlYWxDbGF6eiA9ICdhbGVydCc7XG5cbiAgICBpZiAoY2xhenopIHtcblxuICAgICAgICByZWFsQ2xhenogKz0gJyAnICsgY2xheno7XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICAgIHJlYWxDbGF6eiArPSAnIGFsZXJ0LXN1Y2Nlc3MnO1xuICAgIH1cblxuICAgIG1lc3NhZ2UuY2xhc3NOYW1lID0gcmVhbENsYXp6O1xuICAgIG1lc3NhZ2UuaW5uZXJIVE1MID0gdGV4dDtcblxuICAgIG1lc3NhZ2VzLmFwcGVuZENoaWxkKG1lc3NhZ2UpO1xuXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcblxuICAgICAgICBtZXNzYWdlcy5yZW1vdmVDaGlsZChtZXNzYWdlKTtcblxuICAgIH0sIDIwMDApO1xufTtcbiIsImV4cG9ydHMuZ2V0ID0gZnVuY3Rpb24odXJsKSB7XG5cbiAgICB2YXIgZGVmZXJyZWQgPSBRLmRlZmVyKCk7XG5cbiAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICB4aHIub3BlbignR0VUJywgdXJsLCB0cnVlKTtcblxuICAgIHhoci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLmRhdGEpO1xuXG4gICAgfSwgZmFsc2UpO1xuXG4gICAgeGhyLnNlbmQoKTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuZXhwb3J0cy5wb3N0ID0gZnVuY3Rpb24odXJsLCBkYXRhKSB7XG5cbiAgICB2YXIgZGVmZXJyZWQgPSBRLmRlZmVyKCk7XG5cbiAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICB4aHIub3BlbignUE9TVCcsIHVybCwgdHJ1ZSk7XG5cbiAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcblxuICAgIHhoci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLmRhdGEpO1xuXG4gICAgfSwgZmFsc2UpO1xuXG4gICAgeGhyLnNlbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG5leHBvcnRzLnB1dCA9IGZ1bmN0aW9uKHVybCwgZGF0YSkge1xuXG4gICAgdmFyIGRlZmVycmVkID0gUS5kZWZlcigpO1xuXG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgeGhyLm9wZW4oJ1BVVCcsIHVybCwgdHJ1ZSk7XG5cbiAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcblxuICAgIHhoci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpLmRhdGEpO1xuXG4gICAgfSwgZmFsc2UpO1xuXG4gICAgeGhyLnNlbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG5leHBvcnRzLmRlbGV0ZSA9IGZ1bmN0aW9uKHVybCkge1xuXG4gICAgdmFyIGRlZmVycmVkID0gUS5kZWZlcigpO1xuXG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgeGhyLm9wZW4oJ0RFTEVURScsIHVybCwgdHJ1ZSk7XG5cbiAgICB4aHIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBvYmogPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpO1xuXG4gICAgICAgIGlmIChvYmouc3RhdHVzID09PSBcInN1Y2Nlc3NcIikge1xuXG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKG9iai5kYXRhKTtcblxuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICBkZWZlcnJlZC5yZWplY3Qob2JqKTtcbiAgICAgICAgfVxuXG4gICAgfSwgZmFsc2UpO1xuXG4gICAgeGhyLnNlbmQoKTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuZXhwb3J0cy50ZW1wbGF0ZSA9IGZ1bmN0aW9uKHVybCkge1xuXG4gICAgdmFyIGRlZmVycmVkID0gUS5kZWZlcigpO1xuXG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgeGhyLm9wZW4oJ0dFVCcsIHVybCwgdHJ1ZSk7XG5cbiAgICB4aHIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUoeGhyLnJlc3BvbnNlVGV4dCk7XG5cbiAgICB9LCBmYWxzZSk7XG5cbiAgICB4aHIuc2VuZCgpO1xuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG5yZXR1cm4gZXhwb3J0cztcbiJdfQ==
