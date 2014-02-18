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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvdXNyL2xvY2FsL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL3JhaXZvL2V4cGVuc2VzMi9wdWJsaWMvanMvYXBwLmpzIiwiL2hvbWUvcmFpdm8vZXhwZW5zZXMyL3B1YmxpYy9qcy9jb250cm9sbGVyL2FjY291bnQuanMiLCIvaG9tZS9yYWl2by9leHBlbnNlczIvcHVibGljL2pzL2NvbnRyb2xsZXIvY2FzaC5qcyIsIi9ob21lL3JhaXZvL2V4cGVuc2VzMi9wdWJsaWMvanMvY29udHJvbGxlci9lbnRyeS5qcyIsIi9ob21lL3JhaXZvL2V4cGVuc2VzMi9wdWJsaWMvanMvY29udHJvbGxlci92bS9hY2NvdW50X3ZtLmpzIiwiL2hvbWUvcmFpdm8vZXhwZW5zZXMyL3B1YmxpYy9qcy9jb250cm9sbGVyL3ZtL2VudHJ5X3ZtLmpzIiwiL2hvbWUvcmFpdm8vZXhwZW5zZXMyL3B1YmxpYy9qcy9saWIvYXBpLmpzIiwiL2hvbWUvcmFpdm8vZXhwZW5zZXMyL3B1YmxpYy9qcy9saWIvZGF0ZS5qcyIsIi9ob21lL3JhaXZvL2V4cGVuc2VzMi9wdWJsaWMvanMvbGliL21vbmV5LmpzIiwiL2hvbWUvcmFpdm8vZXhwZW5zZXMyL3B1YmxpYy9qcy9saWIvcGVyaW9kLmpzIiwiL2hvbWUvcmFpdm8vZXhwZW5zZXMyL3B1YmxpYy9qcy9saWIvdmlldy5qcyIsIi9ob21lL3JhaXZvL2V4cGVuc2VzMi9wdWJsaWMvanMvbGliL3hoci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGNhc2ggPSByZXF1aXJlKCcuL2NvbnRyb2xsZXIvY2FzaCcpO1xudmFyIGVudHJ5ID0gcmVxdWlyZSgnLi9jb250cm9sbGVyL2VudHJ5Jyk7XG52YXIgYWNjb3VudCA9IHJlcXVpcmUoJy4vY29udHJvbGxlci9hY2NvdW50Jyk7XG52YXIgdmlldyA9IHJlcXVpcmUoJy4vbGliL3ZpZXcnKTtcbnZhciBwZXJpb2QgPSByZXF1aXJlKCcuL2xpYi9wZXJpb2QnKTtcbnZhciBtb25leSA9IHJlcXVpcmUoJy4vbGliL21vbmV5Jyk7XG52YXIgZGF0ZSA9IHJlcXVpcmUoJy4vbGliL2RhdGUnKTtcblxud2luZG93LmZvcm1hdERhdGUgPSBmdW5jdGlvbih1bml4KSB7XG5cbiAgICByZXR1cm4gZGF0ZS5mb3JtYXQodW5peCk7XG59XG5cbndpbmRvdy5mb3JtYXRBbW91bnQgPSBmdW5jdGlvbihhbW91bnQpIHtcblxuICAgIHJldHVybiBtb25leS5mb3JtYXQoYW1vdW50KTtcbn1cblxucm91dGUoL15lbnRyaWVzLywgZnVuY3Rpb24oKSB7XG5cbiAgICBlbnRyeS5saXN0KCkuZG9uZSgpO1xufSk7XG5cbnJvdXRlKC9eZW50cnlcXC9lZGl0XFwvKFthLXowLTlcXC1dKykvLCBmdW5jdGlvbihpZCkge1xuXG4gICAgZW50cnkuZWRpdChpZCkuZG9uZSgpO1xufSk7XG5cbnJvdXRlKC9eZW50cnlcXC92aWV3XFwvKFthLXowLTlcXC1dKykvLCBmdW5jdGlvbihpZCkge1xuXG4gICAgZW50cnkudmlldyhpZCkuZG9uZSgpO1xufSk7XG5cbnJvdXRlKC9eZW50cnlcXC9hZGQvLCBmdW5jdGlvbigpIHtcblxuICAgIGVudHJ5LmFkZCgpLmRvbmUoKTtcbn0pO1xuXG5yb3V0ZSgvXmFjY291bnRzLywgZnVuY3Rpb24oKSB7XG5cbiAgICBhY2NvdW50Lmxpc3QoKS5kb25lKCk7XG59KTtcblxucm91dGUoL15hY2NvdW50XFwvYWRkLywgZnVuY3Rpb24oKSB7XG5cbiAgICBhY2NvdW50LmFkZCgpLmRvbmUoKTtcbn0pO1xuXG5yb3V0ZSgvXmFjY291bnRcXC9lZGl0XFwvKC4rKS8sIGZ1bmN0aW9uKGlkKSB7XG5cbiAgICBhY2NvdW50LmVkaXQoaWQpLmRvbmUoKTtcbn0pO1xuXG5yb3V0ZSgvXmFjY291bnRcXC8oLispXFwvaXRlbXMvLCBmdW5jdGlvbihpZCkge1xuXG4gICAgYWNjb3VudC5pdGVtcyhpZCkuZG9uZSgpO1xufSk7XG5cbnJvdXRlKC9eY2FzaC8sIGZ1bmN0aW9uKCkge1xuXG4gICAgY2FzaC5zaG93KCkuZG9uZSgpO1xufSk7XG5cbnJvdXRlKC9eaGVscC8sIGZ1bmN0aW9uKCkge1xuXG4gICAgdmlldy5zaG93KCdoZWxwJywge30pLmRvbmUoKTtcbn0pO1xuXG5yb3V0ZSgvLiovLCBmdW5jdGlvbigpIHtcblxuICAgIHJvdXRlLmdvKCdlbnRyaWVzJyk7XG59KTtcblxudmFyIHBlcmlvZEZvcm0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGVyaW9kJyk7XG5cbmtvLmFwcGx5QmluZGluZ3MocGVyaW9kLCBwZXJpb2RGb3JtKTtcbiIsInZhciBhY2NvdW50Vk0gPSByZXF1aXJlKCcuL3ZtL2FjY291bnRfdm0nKTtcbnZhciBhcGkgPSByZXF1aXJlKCcuLi9saWIvYXBpJyk7XG52YXIgdmlldyA9IHJlcXVpcmUoJy4uL2xpYi92aWV3Jyk7XG52YXIgcGVyaW9kID0gcmVxdWlyZSgnLi4vbGliL3BlcmlvZCcpO1xuXG4vLyBTaG93cyB0aGUgbGlzdCBvZiBhY2NvdW50cy5cblxuZXhwb3J0cy5saXN0ID0gZnVuY3Rpb24oKSB7XG5cbiAgICByZXR1cm4gYXBpLmFjY291bnQuYWxsKCkudGhlbihmdW5jdGlvbihhY2NvdW50cykge1xuXG4gICAgICAgIHJldHVybiB2aWV3LnNob3coJ2FjY291bnRzJywgeyBhY2NvdW50czogYWNjb3VudHMgfSk7XG4gICAgfSk7XG59O1xuXG4vLyBTaG93cyBlbnRyeSBpdGVtcyBmb3IgdGhlIGdpdmVuIGFjY291bnQuXG5cbmV4cG9ydHMuaXRlbXMgPSBmdW5jdGlvbihpZCkge1xuXG4gICAgdmFyIHN0YXJ0ID0gcGVyaW9kLnN0YXJ0KCksIGVuZCA9IHBlcmlvZC5lbmQoKTtcblxuICAgIHJldHVybiBhcGkuYWNjb3VudC5pdGVtcyhpZCwgc3RhcnQsIGVuZCkudGhlbihmdW5jdGlvbihhY2NvdW50cykge1xuXG4gICAgICAgIHJldHVybiBhcGkuYWNjb3VudC5nZXQoaWQpLnRoZW4oZnVuY3Rpb24oYWNjb3VudCkge1xuXG4gICAgICAgICAgICB2YXIgdG90YWwgPSAwO1xuXG4gICAgICAgICAgICBhY2NvdW50cy5mb3JFYWNoKGZ1bmN0aW9uKGFjY291bnQpIHtcblxuICAgICAgICAgICAgICAgIHRvdGFsICs9IGFjY291bnQuZWZmZWN0O1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiB2aWV3LnNob3coJ2FjY291bnRfZW50cmllcycsIHtcblxuICAgICAgICAgICAgICAgIGFjY291bnRzOiBhY2NvdW50cyxcbiAgICAgICAgICAgICAgICBhY2NvdW50OiBhY2NvdW50LFxuICAgICAgICAgICAgICAgIHRvdGFsOiB0b3RhbFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuLy8gU2hvd3MgdGhlIG5ldyBhY2NvdW50IGZvcm0uXG5cbmV4cG9ydHMuYWRkID0gZnVuY3Rpb24oKSB7XG5cbiAgICByZXR1cm4gdmlldy5zaG93KCdhY2NvdW50JywgYWNjb3VudFZNKCkpO1xufTtcblxuLy8gU2hvd3MgdGhlIGFjY291bnQgZWRpdCBmb3JtIGZvciB0aGUgZ2l2ZW4gYWNjb3VudC5cblxuZXhwb3J0cy5lZGl0ID0gZnVuY3Rpb24oaWQpIHtcblxuICAgIHJldHVybiBhcGkuYWNjb3VudC5nZXQoaWQpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuXG4gICAgICAgIHJldHVybiB2aWV3LnNob3coJ2FjY291bnQnLCBhY2NvdW50Vk0oZGF0YSkpO1xuICAgIH0pO1xufTtcblxucmV0dXJuIGV4cG9ydHM7XG4iLCJ2YXIgYXBpID0gcmVxdWlyZSgnLi4vbGliL2FwaScpO1xudmFyIHZpZXcgPSByZXF1aXJlKCcuLi9saWIvdmlldycpO1xudmFyIHBlcmlvZCA9IHJlcXVpcmUoJy4uL2xpYi9wZXJpb2QnKTtcblxuZXhwb3J0cy5zaG93ID0gZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgc3RhcnQgPSBwZXJpb2Quc3RhcnQoKSwgZW5kID0gcGVyaW9kLmVuZCgpO1xuXG4gICAgcmV0dXJuIGFwaS5jYXNoLmxpc3Qoc3RhcnQsIGVuZCkudGhlbihmdW5jdGlvbihpdGVtcykge1xuXG4gICAgICAgIHZhciBzdW1tYXJ5ID0ge307XG4gICAgICAgIHZhciBhY2NvdW50cyA9IHt9O1xuXG4gICAgICAgIGl0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuXG4gICAgICAgICAgICB2YXIgY29kZSA9IGl0ZW0uYWNjb3VudC5jb2RlO1xuXG4gICAgICAgICAgICBhY2NvdW50c1tjb2RlXSA9IGl0ZW0uYWNjb3VudDtcblxuICAgICAgICAgICAgc3VtbWFyeVtjb2RlXSA9IChzdW1tYXJ5W2NvZGVdIHx8IDApICsgaXRlbS5hbW91bnQ7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBzdW1MaXN0ID0gT2JqZWN0LmtleXMoc3VtbWFyeSkubWFwKGZ1bmN0aW9uKGNvZGUpIHtcblxuICAgICAgICAgICAgcmV0dXJuIHsgYWNjb3VudDogYWNjb3VudHNbY29kZV0sIGFtb3VudDogc3VtbWFyeVtjb2RlXSB9O1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdmlldy5zaG93KCdjYXNoJywgeyBpdGVtczogaXRlbXMsIHN1bW1hcnk6IHN1bUxpc3QgfSk7XG4gICAgfSk7XG59O1xuIiwidmFyIGVudHJ5Vk0gPSByZXF1aXJlKCcuL3ZtL2VudHJ5X3ZtJyk7XG52YXIgYXBpID0gcmVxdWlyZSgnLi4vbGliL2FwaScpO1xudmFyIHZpZXcgPSByZXF1aXJlKCcuLi9saWIvdmlldycpO1xudmFyIHBlcmlvZCA9IHJlcXVpcmUoJy4uL2xpYi9wZXJpb2QnKTtcblxuLy8gU2hvd3Mgc2luZ2xlIGVudHJ5LlxuXG5leHBvcnRzLnZpZXcgPSBmdW5jdGlvbihpZCkge1xuXG4gICAgcmV0dXJuIGFwaS5lbnRyeS5mdWxsKGlkKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcblxuICAgICAgICBkYXRhLml0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuXG4gICAgICAgICAgICBpdGVtLmRlYml0ID0gZGF0YS5hY2NvdW50c1tpdGVtLmRlYml0XTtcbiAgICAgICAgICAgIGl0ZW0uY3JlZGl0ID0gZGF0YS5hY2NvdW50c1tpdGVtLmNyZWRpdF07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGRhdGEuY2hhbmdlcyA9IE9iamVjdC5rZXlzKGRhdGEuY2hhbmdlcykubWFwKGZ1bmN0aW9uKGtleSkge1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGFjY291bnQ6IGRhdGEuYWNjb3VudHNba2V5XSxcbiAgICAgICAgICAgICAgICBjaGFuZ2U6IGRhdGEuY2hhbmdlc1trZXldXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIEhhbmRsZXIgZm9yIGNvcHlpbmcgdGhlIGVudHJ5LlxuXG4gICAgICAgIGRhdGEuY29weSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICBhcGkuZW50cnkuZ2V0KGlkKS50aGVuKGZ1bmN0aW9uKGVudHJ5KSB7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gYXBpLmFjY291bnQuYWxsKCkudGhlbihmdW5jdGlvbihhY2NvdW50cykge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFVuc2V0IGVudHJ5IGlkLlxuXG4gICAgICAgICAgICAgICAgICAgIGVudHJ5LiRpZCA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZpZXcuc2hvdygnZW50cnknLCBlbnRyeVZNKGFjY291bnRzLCBlbnRyeSkpLnRoZW4oZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCBmb2N1cyB0byB0aXRsZSBmaWVsZC5cblxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2VudHJ5LXRpdGxlJykuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0pLmRvbmUoKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gdmlldy5zaG93KCdlbnRyeV92aWV3JywgZGF0YSk7XG4gICAgfSk7XG59O1xuXG4vLyBTaG93cyB0aGUgbGlzdCBvZiBlbnRyaWVzLlxuXG5leHBvcnRzLmxpc3QgPSBmdW5jdGlvbigpIHtcblxuICAgIHZhciBzdGFydCA9IHBlcmlvZC5zdGFydCgpLCBlbmQgPSBwZXJpb2QuZW5kKCk7XG5cbiAgICByZXR1cm4gYXBpLmVudHJ5Lmxpc3Qoc3RhcnQsIGVuZCkudGhlbihmdW5jdGlvbihlbnRyaWVzKSB7XG5cbiAgICAgICAgcmV0dXJuIHZpZXcuc2hvdygnZW50cmllcycsIHsgZW50cmllczogZW50cmllcyB9KTtcbiAgICB9KTtcbn07XG5cbi8vIFNob3dzIHRoZSBlZGl0IGZvcm0gZm9yIHRoZSBlbnRyeS5cblxuZXhwb3J0cy5lZGl0ID0gZnVuY3Rpb24oaWQpIHtcblxuICAgIHJldHVybiBhcGkuZW50cnkuZ2V0KGlkKS50aGVuKGZ1bmN0aW9uKGVudHJ5KSB7XG5cbiAgICAgICAgcmV0dXJuIGFwaS5hY2NvdW50LmFsbCgpLnRoZW4oZnVuY3Rpb24oYWNjb3VudHMpIHtcblxuICAgICAgICAgICAgcmV0dXJuIHZpZXcuc2hvdygnZW50cnknLCBlbnRyeVZNKGFjY291bnRzLCBlbnRyeSkpLnRoZW4oZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZW50cnktdGl0bGUnKS5mb2N1cygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuLy8gU2hvd3MgdGhlIGVkaXQgZm9ybSBmb3IgYWRkaW5nIGEgbmV3IGVudHJ5LlxuXG5leHBvcnRzLmFkZCA9IGZ1bmN0aW9uKGlkKSB7XG5cbiAgICByZXR1cm4gYXBpLmFjY291bnQuYWxsKCkudGhlbihmdW5jdGlvbihhY2NvdW50cykge1xuXG4gICAgICAgIHJldHVybiB2aWV3LnNob3coJ2VudHJ5JywgZW50cnlWTShhY2NvdW50cykpLnRoZW4oZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdlbnRyeS10aXRsZScpLmZvY3VzKCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcbiIsInZhciB2aWV3ID0gcmVxdWlyZSgnLi4vLi4vbGliL3ZpZXcnKTtcbnZhciBhcGkgPSByZXF1aXJlKCcuLi8uLi9saWIvYXBpJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZGF0YSkge1xuXG4gICAgdmFyIGFjY291bnQgPSB7XG5cbiAgICAgICAgJGlkOiBudWxsLFxuICAgICAgICBjb2RlOiBrby5vYnNlcnZhYmxlKCksXG4gICAgICAgIG5hbWU6IGtvLm9ic2VydmFibGUoKSxcbiAgICAgICAgdHlwZToga28ub2JzZXJ2YWJsZSgpLFxuICAgICAgICB0eXBlczogWydsaWFiaWxpdHknLCAnaW5jb21lJywgJ2VxdWl0eScsXG4gICAgICAgICAgICAnYXNzZXQnLCAnZXhwZW5zZScsICdjYXNoJywgJ2JhbmsnXVxuICAgIH1cblxuICAgIGlmIChkYXRhKSB7XG5cbiAgICAgICAgYWNjb3VudC4kaWQgPSBkYXRhLiRpZDtcbiAgICAgICAgYWNjb3VudC5jb2RlKGRhdGEuY29kZSk7XG4gICAgICAgIGFjY291bnQubmFtZShkYXRhLm5hbWUpO1xuICAgICAgICBhY2NvdW50LnR5cGUoZGF0YS50eXBlKTtcbiAgICB9XG5cbiAgICBhY2NvdW50LnRvSlMgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICByZXR1cm4ge1xuXG4gICAgICAgICAgICBjb2RlOiBhY2NvdW50LmNvZGUoKSxcbiAgICAgICAgICAgIG5hbWU6IGFjY291bnQubmFtZSgpLFxuICAgICAgICAgICAgdHlwZTogYWNjb3VudC50eXBlKClcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgYWNjb3VudC50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHJldHVybiBhY2NvdW50LmNvZGUoKSArICcgKCcgKyBhY2NvdW50Lm5hbWUoKSArICcpJztcbiAgICB9O1xuXG4gICAgYWNjb3VudC5zYXZlID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgaWYgKGFjY291bnQuJGlkKSB7XG5cbiAgICAgICAgICAgIGFwaS5hY2NvdW50LnVwZGF0ZShhY2NvdW50LiRpZCwgYWNjb3VudC50b0pTKCkpLmRvbmUoZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaGFzaCA9ICcjYWNjb3VudHMnO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgYXBpLmFjY291bnQuc2F2ZShhY2NvdW50LnRvSlMoKSkuZG9uZShmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gJyNhY2NvdW50cyc7XG5cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdmlldy5tZXNzYWdlKCdBY2NvdW50IGlzIHNhdmVkLicpO1xuICAgIH07XG5cbiAgICBhY2NvdW50LnJlbW92ZSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGlmIChhY2NvdW50LiRpZCkge1xuXG4gICAgICAgICAgICBpZiAoY29uZmlybSgnRGVsZXRlIHRoZSBhY2NvdW50PycpKSB7XG5cbiAgICAgICAgICAgICAgICBhcGkuYWNjb3VudC5yZW1vdmUoYWNjb3VudC4kaWQpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcblxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaGFzaCA9ICcjYWNjb3VudHMnO1xuXG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmlldy5tZXNzYWdlKCdDYW5ub3QgZGVsZXRlIHRoZSBhY2NvdW50LiAnICsgZXJyLm1lc3NhZ2UsICdhbGVydC1kYW5nZXInKTtcblxuICAgICAgICAgICAgICAgIH0pLmRvbmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gYWNjb3VudDtcbn1cbiIsInZhciBtb25leSA9IHJlcXVpcmUoJy4uLy4uL2xpYi9tb25leScpO1xudmFyIGRhdGUgPSByZXF1aXJlKCcuLi8uLi9saWIvZGF0ZScpO1xudmFyIHZpZXcgPSByZXF1aXJlKCcuLi8uLi9saWIvdmlldycpO1xudmFyIGFwaSA9IHJlcXVpcmUoJy4uLy4uL2xpYi9hcGknKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhY2NvdW50cywgZGF0YSkge1xuXG4gICAgdmFyIGVudHJ5ID0ge1xuXG4gICAgICAgIHRpdGxlOiBrby5vYnNlcnZhYmxlKCksXG4gICAgICAgICRpZDogbnVsbCxcbiAgICAgICAgaXRlbXM6IGtvLm9ic2VydmFibGVBcnJheShbXSksXG4gICAgICAgIGFjY291bnRzOiBhY2NvdW50cyxcbiAgICAgICAgY3VycmVuY2llczogWydFVVInLCAnVVNEJywgJ0dCUCddXG4gICAgfTtcblxuICAgIGlmIChkYXRhKSB7XG5cbiAgICAgICAgZW50cnkuJGlkID0gZGF0YS4kaWQ7XG4gICAgICAgIGVudHJ5LnRpdGxlKGRhdGEudGl0bGUpO1xuXG4gICAgICAgIGRhdGEuaXRlbXMuZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG5cbiAgICAgICAgICAgIGVudHJ5Lml0ZW1zLnB1c2goaXRlbVZNKGl0ZW0pKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZW50cnkudG9KUyA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHJldHVybiB7XG5cbiAgICAgICAgICAgIHRpdGxlOiBlbnRyeS50aXRsZSgpLFxuICAgICAgICAgICAgaXRlbXM6IGVudHJ5Lml0ZW1zKCkubWFwKGZ1bmN0aW9uKGl0ZW0pIHtcblxuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtLnRvSlMoKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIGVudHJ5LmFjY291bnRUZXh0ID0gZnVuY3Rpb24oYWNjb3VudCkge1xuXG4gICAgICAgIHJldHVybiBhY2NvdW50LmNvZGUgKyAnICgnICsgYWNjb3VudC5uYW1lICsgJyknO1xuICAgIH07XG5cbiAgICBlbnRyeS5hY2NvdW50VmFsdWUgPSBmdW5jdGlvbihhY2NvdW50KSB7XG5cbiAgICAgICAgcmV0dXJuIGFjY291bnQuJGlkO1xuICAgIH07XG5cbiAgICBlbnRyeS5zYXZlID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgaWYgKGVudHJ5LiRpZCkge1xuXG4gICAgICAgICAgICBhcGkuZW50cnkudXBkYXRlKGVudHJ5LiRpZCwgZW50cnkudG9KUygpKS5kb25lKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSAnI2VudHJ5L3ZpZXcvJyArIGVudHJ5LiRpZDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIGFwaS5lbnRyeS5zYXZlKGVudHJ5LnRvSlMoKSkuZG9uZShmdW5jdGlvbihkYXRhKSB7XG5cbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaGFzaCA9ICcjZW50cnkvdmlldy8nICsgZGF0YTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdmlldy5tZXNzYWdlKCdUaGUgZW50cnkgaXMgc2F2ZWQuJyk7XG4gICAgfTtcblxuICAgIGVudHJ5LnJlbW92ZSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGlmIChlbnRyeS4kaWQpIHtcblxuICAgICAgICAgICAgaWYgKGNvbmZpcm0oJ1JlbW92ZSB0aGUgZW50cnk/JykpIHtcblxuICAgICAgICAgICAgICAgIGFwaS5lbnRyeS5yZW1vdmUoZW50cnkuJGlkKS5kb25lKGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gJyNlbnRyaWVzJztcblxuICAgICAgICAgICAgICAgICAgICB2aWV3Lm1lc3NhZ2UoJ1RoZSBlbnRyeSBpcyBkZWxldGVkLicpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGVudHJ5LmFkZEl0ZW0gPSBmdW5jdGlvbigpIHtcblxuICAgICAgICBlbnRyeS5pdGVtcy5wdXNoKGl0ZW1WTSgpKTtcbiAgICB9O1xuXG4gICAgZW50cnkucmVtb3ZlSXRlbSA9IGZ1bmN0aW9uKGl0ZW0pIHtcblxuICAgICAgICBpZiAoY29uZmlybSgnUmVtb3ZlIHRoZSBpdGVtICcgKyBpdGVtLnRpdGxlKCkgKyAnPycpKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGVudHJ5Lml0ZW1zLnJlbW92ZShpdGVtKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gZW50cnk7XG59XG5cbmZ1bmN0aW9uIGl0ZW1WTShkYXRhKSB7XG5cbiAgICB2YXIgaXRlbSA9IHtcblxuICAgICAgICB0aXRsZToga28ub2JzZXJ2YWJsZSgpLFxuICAgICAgICBkYXRlOiBrby5vYnNlcnZhYmxlKCksXG4gICAgICAgIGRlYml0OiBrby5vYnNlcnZhYmxlKCksXG4gICAgICAgIGNyZWRpdDoga28ub2JzZXJ2YWJsZSgpLFxuICAgICAgICBjdXJyZW5jeToga28ub2JzZXJ2YWJsZSgpLFxuICAgICAgICBhbW91bnQ6IGtvLm9ic2VydmFibGUoKSxcbiAgICAgICAgZXVyX2Ftb3VudDoga28ub2JzZXJ2YWJsZSgpXG4gICAgfTtcblxuICAgIGl0ZW0uZXVyX29yaWcgPSBrby5jb21wdXRlZChmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgYW1vdW50ID0gaXRlbS5hbW91bnQoKTtcbiAgICAgICAgdmFyIGN1cnJlbmN5ID0gaXRlbS5jdXJyZW5jeSgpO1xuXG4gICAgICAgIGlmIChhbW91bnQgJiYgY3VycmVuY3kgPT09ICdFVVInKSB7XG5cbiAgICAgICAgICAgIHJldHVybiBhbW91bnQ7XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgaXRlbS5ldXJfb3JpZy5zdWJzY3JpYmUoZnVuY3Rpb24odmFsdWUpIHtcblxuICAgICAgICBpZiAodmFsdWUpIHtcblxuICAgICAgICAgICAgaXRlbS5ldXJfYW1vdW50KHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKGRhdGEpIHtcblxuICAgICAgICBpdGVtLnRpdGxlKGRhdGEudGl0bGUpO1xuICAgICAgICBpdGVtLmRhdGUoZGF0ZS5mb3JtYXQoZGF0YS5kYXRlKSk7XG4gICAgICAgIGl0ZW0uZGViaXQoZGF0YS5kZWJpdCk7XG4gICAgICAgIGl0ZW0uY3JlZGl0KGRhdGEuY3JlZGl0KTtcbiAgICAgICAgaXRlbS5hbW91bnQobW9uZXkuZm9ybWF0KGRhdGEuYW1vdW50KSk7XG4gICAgICAgIGl0ZW0uY3VycmVuY3koZGF0YS5jdXJyZW5jeS50b1VwcGVyQ2FzZSgpKTtcbiAgICAgICAgaXRlbS5ldXJfYW1vdW50KG1vbmV5LmZvcm1hdChkYXRhLmV1cl9hbW91bnQpKTtcblxuICAgIH0gZWxzZSB7XG5cbiAgICAgICAgaXRlbS5kYXRlKGRhdGUuZm9ybWF0KE1hdGguZmxvb3IoRGF0ZS5ub3coKSAvIDEwMDApKSk7XG4gICAgfVxuXG4gICAgaXRlbS50b0pTID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgcmV0dXJuIHtcblxuICAgICAgICAgICAgdGl0bGU6IGl0ZW0udGl0bGUoKSxcbiAgICAgICAgICAgIGRhdGU6IGRhdGUucGFyc2UoaXRlbS5kYXRlKCkpLFxuICAgICAgICAgICAgZGViaXQ6IGl0ZW0uZGViaXQoKSxcbiAgICAgICAgICAgIGNyZWRpdDogaXRlbS5jcmVkaXQoKSxcbiAgICAgICAgICAgIGFtb3VudDogbW9uZXkucGFyc2UoaXRlbS5hbW91bnQoKSksXG4gICAgICAgICAgICBjdXJyZW5jeTogaXRlbS5jdXJyZW5jeSgpLnRvTG93ZXJDYXNlKCksXG4gICAgICAgICAgICBldXJfYW1vdW50OiBtb25leS5wYXJzZShpdGVtLmV1cl9hbW91bnQoKSlcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGl0ZW07XG59O1xuIiwidmFyIFhIUiA9IHJlcXVpcmUoJy4veGhyJyk7XG5cbmV4cG9ydHMuZW50cnkgPSB7XG5cbiAgICBmdWxsOiBmdW5jdGlvbihpZCkge1xuXG4gICAgICAgIHJldHVybiBYSFIuZ2V0KCcvYXBpL2VudHJ5LycgKyBpZCArICcvZnVsbCcpO1xuICAgIH0sXG5cbiAgICBnZXQ6IGZ1bmN0aW9uKGlkKSB7XG5cbiAgICAgICAgcmV0dXJuIFhIUi5nZXQoJy9hcGkvZW50cnkvJyArIGlkKTtcbiAgICB9LFxuXG4gICAgbGlzdDogZnVuY3Rpb24oc3RhcnQsIGVuZCkge1xuXG4gICAgICAgIHZhciB1cmwgPSAnL2FwaS9lbnRyaWVzLycgKyBzdGFydCArICcvJyArIGVuZDtcblxuICAgICAgICByZXR1cm4gWEhSLmdldCh1cmwpO1xuICAgIH0sXG5cbiAgICByZW1vdmU6IGZ1bmN0aW9uKGlkKSB7XG5cbiAgICAgICAgcmV0dXJuIFhIUi5kZWxldGUoJy9hcGkvZW50cnkvJyArIGlkKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlOiBmdW5jdGlvbihpZCwgZGF0YSkge1xuXG4gICAgICAgIHJldHVybiBYSFIucHV0KCcvYXBpL2VudHJ5LycgKyBpZCwgZGF0YSk7XG4gICAgfSxcblxuICAgIHNhdmU6IGZ1bmN0aW9uKGRhdGEpIHtcblxuICAgICAgICByZXR1cm4gWEhSLnBvc3QoJy9hcGkvZW50cnknLCBkYXRhKTtcbiAgICB9XG59O1xuXG5leHBvcnRzLmFjY291bnQgPSB7XG5cbiAgICBhbGw6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHJldHVybiBYSFIuZ2V0KCcvYXBpL2FjY291bnRzJyk7XG4gICAgfSxcblxuICAgIGl0ZW1zOiBmdW5jdGlvbihpZCwgc3RhcnQsIGVuZCkge1xuXG4gICAgICAgIHZhciB1cmwgPSAnL2FwaS9hY2NvdW50LycgKyBpZCArICcvaXRlbXMvJyArXG4gICAgICAgICAgICBzdGFydCArICcvJyArIGVuZDtcblxuICAgICAgICByZXR1cm4gWEhSLmdldCh1cmwpO1xuICAgIH0sXG5cbiAgICBnZXQ6IGZ1bmN0aW9uKGlkKSB7XG5cbiAgICAgICAgcmV0dXJuIFhIUi5nZXQoJy9hcGkvYWNjb3VudC8nICsgaWQpO1xuICAgIH0sXG5cbiAgICB1cGRhdGU6IGZ1bmN0aW9uKGlkLCBkYXRhKSB7XG5cbiAgICAgICAgcmV0dXJuIFhIUi5wdXQoJy9hcGkvYWNjb3VudC8nICsgaWQsIGRhdGEpO1xuICAgIH0sXG5cbiAgICBzYXZlOiBmdW5jdGlvbihkYXRhKSB7XG5cbiAgICAgICAgcmV0dXJuIFhIUi5wb3N0KCcvYXBpL2FjY291bnQnLCBkYXRhKTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihpZCkge1xuXG4gICAgICAgIHJldHVybiBYSFIuZGVsZXRlKCcvYXBpL2FjY291bnQvJyArIGlkKTtcbiAgICB9XG59O1xuXG5leHBvcnRzLmNhc2ggPSB7XG5cbiAgICBsaXN0OiBmdW5jdGlvbihzdGFydCwgZW5kKSB7XG5cbiAgICAgICAgdmFyIHVybCA9ICcvYXBpL2Nhc2gvJyArIHN0YXJ0ICsgJy8nICsgZW5kO1xuXG4gICAgICAgIHJldHVybiBYSFIuZ2V0KHVybCk7XG4gICAgfVxufTtcbiIsImV4cG9ydHMucGFyc2UgPSBmdW5jdGlvbih0ZXh0KSB7XG5cbiAgICB2YXIgbWF0Y2ggPSB0ZXh0Lm1hdGNoKC8oXFxkezJ9KVxcLihcXGR7Mn0pXFwuKFxcZHs0fSkvKTtcblxuICAgIGlmIChtYXRjaCkge1xuXG4gICAgICAgIHZhciBtb250aERhdGUgPSBwYXJzZUludChtYXRjaFsxXSwgMTApO1xuICAgICAgICB2YXIgbW9udGggPSBwYXJzZUludChtYXRjaFsyXSwgMTApIC0gMTtcbiAgICAgICAgdmFyIHllYXIgPSBwYXJzZUludChtYXRjaFszXSwgMTApO1xuXG4gICAgICAgIHZhciBkYXRlID0gbmV3IERhdGUoKTtcblxuICAgICAgICBkYXRlLnNldFVUQ0hvdXJzKDAsIDAsIDAsIDApO1xuICAgICAgICBkYXRlLnNldFVUQ0Z1bGxZZWFyKHllYXIsIG1vbnRoLCBtb250aERhdGUpO1xuXG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKGRhdGUuZ2V0VGltZSgpIC8gMTAwMCk7XG5cbiAgICB9IGVsc2Uge1xuXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHBhcnNlIGRhdGUgJyArIHRleHQpO1xuICAgIH1cbn07XG5cbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24odW5peCkge1xuXG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZSh1bml4ICogMTAwMCk7XG5cbiAgICB2YXIgeWVhciA9IGRhdGUuZ2V0VVRDRnVsbFllYXIoKTtcbiAgICB2YXIgbW9udGggPSBkYXRlLmdldFVUQ01vbnRoKCkgKyAxO1xuICAgIHZhciBkYXkgPSBkYXRlLmdldFVUQ0RhdGUoKTtcblxuICAgIGZ1bmN0aW9uIHBhZCh4KSB7XG5cbiAgICAgICAgcmV0dXJuIHggPCAxMCA/ICcwJyArIHggOiAnJyArIHg7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhZChkYXkpICsgJy4nICsgcGFkKG1vbnRoKSArICcuJyArIHllYXI7XG59O1xuIiwiZXhwb3J0cy5wYXJzZSA9IGZ1bmN0aW9uKHN0cmluZykge1xuXG4gICAgdmFyIG1hdGNoID0gc3RyaW5nLm1hdGNoKC8oXFxkKykoPzpcXC4oXFxkezJ9KSk/Lyk7XG5cbiAgICBpZiAobWF0Y2gpIHtcblxuICAgICAgICB2YXIgaW50ZWdlclBhcnQgPSBwYXJzZUludChtYXRjaFsxXSwgMTApO1xuICAgICAgICB2YXIgZnJhY3Rpb25hbFBhcnQgPSAwO1xuXG4gICAgICAgIGlmIChtYXRjaFsyXSkge1xuXG4gICAgICAgICAgICBmcmFjdGlvbmFsUGFydCA9IHBhcnNlSW50KG1hdGNoWzJdLCAxMCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaW50ZWdlclBhcnQgKiAxMDAgKyBmcmFjdGlvbmFsUGFydDtcblxuICAgIH0gZWxzZSB7XG5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgcGFyc2UgJyArIHN0cmluZyk7XG4gICAgfVxufTtcblxuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbih2YWx1ZSkge1xuXG4gICAgdmFyIG5lZyA9IGZhbHNlO1xuXG4gICAgaWYgKHZhbHVlIDwgMCkge1xuXG4gICAgICAgIG5lZyA9IHRydWU7XG4gICAgICAgIHZhbHVlID0gLXZhbHVlO1xuICAgIH1cblxuICAgIHZhciBpbnRlZ2VyUGFydCA9IE1hdGguZmxvb3IodmFsdWUgLyAxMDApO1xuICAgIHZhciBmcmFjdGlvbmFsUGFydCA9IHZhbHVlICUgMTAwO1xuXG4gICAgcmV0dXJuIChuZWcgPyAnLScgOiAnJykgKyBpbnRlZ2VyUGFydCArICcuJyArXG4gICAgICAgICgoZnJhY3Rpb25hbFBhcnQgPCAxMCA/ICcwJyA6ICcnKSArIGZyYWN0aW9uYWxQYXJ0KTtcbn07XG4iLCJleHBvcnRzLnN0YXJ0X21vbnRoID0ga28ub2JzZXJ2YWJsZSgpO1xuZXhwb3J0cy5lbmRfbW9udGggPSBrby5vYnNlcnZhYmxlKCk7XG5cbmV4cG9ydHMuc3RhcnQgPSBmdW5jdGlvbigpIHtcblxuICAgIHZhciBtb250aCA9IGV4cG9ydHMubW9udGhzLmluZGV4T2YoZXhwb3J0cy5zdGFydF9tb250aCgpKTtcbiAgICB2YXIgeWVhciA9IHBhcnNlSW50KGV4cG9ydHMueWVhcigpLCAxMCk7XG5cbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG5cbiAgICBkYXRlLnNldFVUQ0Z1bGxZZWFyKHllYXIsIG1vbnRoLCAxKTtcbiAgICBkYXRlLnNldFVUQ0hvdXJzKDAsIDAsIDAsIDApO1xuXG4gICAgcmV0dXJuIE1hdGguZmxvb3IoZGF0ZS5nZXRUaW1lKCkgLyAxMDAwKTtcbn07XG5cbmV4cG9ydHMuZW5kID0gZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgbW9udGggPSBleHBvcnRzLm1vbnRocy5pbmRleE9mKGV4cG9ydHMuZW5kX21vbnRoKCkpO1xuICAgIHZhciB5ZWFyID0gcGFyc2VJbnQoZXhwb3J0cy55ZWFyKCksIDEwKTtcblxuICAgIGlmIChtb250aCA9PT0gMTEpIHtcblxuICAgICAgICBtb250aCA9IDA7XG4gICAgICAgIHllYXIgKz0gMTtcblxuICAgIH0gZWxzZSB7XG5cbiAgICAgICAgbW9udGggKz0gMTtcbiAgICB9XG5cbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKCk7XG5cbiAgICBkYXRlLnNldFVUQ0Z1bGxZZWFyKHllYXIsIG1vbnRoLCAxKTtcbiAgICBkYXRlLnNldFVUQ0hvdXJzKDAsIDAsIDAsIDApO1xuXG4gICAgLy8gT25lIGRheSBiZWZvcmUgc3RhcnQgb2YgdGhlIG5leHQgbW9udGguXG5cbiAgICByZXR1cm4gTWF0aC5mbG9vcihkYXRlLmdldFRpbWUoKSAvIDEwMDApIC0gMTtcbn07XG5cbmV4cG9ydHMudXBkYXRlID0gZnVuY3Rpb24oKSB7XG5cbiAgICByb3V0ZS5yZWZyZXNoKCk7XG59O1xuXG52YXIgY3VycmVudERhdGUgPSBuZXcgRGF0ZSgpO1xudmFyIGN1cnJlbnRZZWFyID0gY3VycmVudERhdGUuZ2V0VVRDRnVsbFllYXIoKTtcbnZhciBjdXJyZW50TW9udGggPSBjdXJyZW50RGF0ZS5nZXRVVENNb250aCgpO1xuXG5leHBvcnRzLm1vbnRocyA9IFsnSmFudWFyeScsICdGZWJydWFyeScsICdNYXJjaCcsICdBcHJpbCcsICdNYXknLCAnSnVuZScsXG4gICAgJ0p1bHknLCAnQXVndXN0JywgJ1NlcHRlbWJlcicsICdPY3RvYmVyJywgJ05vdmVtYmVyJywgJ0RlY2VtYmVyJ107XG5cbmV4cG9ydHMueWVhciA9IGtvLm9ic2VydmFibGUoY3VycmVudFllYXIudG9TdHJpbmcoKSk7XG5leHBvcnRzLnllYXJzID0gW107XG5cbmZvciAodmFyIHkgPSAyMDEyOyB5IDw9IGN1cnJlbnRZZWFyICsgMTsgeSsrKSB7XG5cbiAgICBleHBvcnRzLnllYXJzLnB1c2goeS50b1N0cmluZygpKTtcbn1cblxuZXhwb3J0cy5zdGFydF9tb250aChleHBvcnRzLm1vbnRoc1tjdXJyZW50TW9udGhdKTtcbmV4cG9ydHMuZW5kX21vbnRoKGV4cG9ydHMubW9udGhzW2N1cnJlbnRNb250aF0pO1xuXG5yZXR1cm4gZXhwb3J0cztcbiIsInZhciBYSFIgPSByZXF1aXJlKCcuL3hocicpO1xuXG4vLyBTaG93cyB0ZW1wbGF0ZSAoYnkgaWQpIHdpdGggdGhlIGdpdmVuIG1vZGVsXG5cbmV4cG9ydHMuc2hvdyA9IGZ1bmN0aW9uKGlkLCBtb2RlbCkge1xuXG4gICAgdmFyIGNvbnRlbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY29udGVudCcpO1xuXG4gICAgaWYgKGNvbnRlbnQuY2hpbGRyZW4ubGVuZ3RoID09PSAxKSB7XG5cbiAgICAgICAgLy8gU29tZXRoaW5nIHdhcyBwcmV2aW91c2x5IHNob3duLFxuICAgICAgICAvLyByZW1vdmUgaXQuXG5cbiAgICAgICAga28ucmVtb3ZlTm9kZShjb250ZW50LmNoaWxkcmVuWzBdKTtcbiAgICB9XG5cbiAgICAvLyBMb2FkIHRlbXBsYXRlLCB0dXJuIGludG8gRE9NLCBiaW5kIHdpdGggS25vY2tvdXRKUy5cblxuICAgIHJldHVybiBYSFIudGVtcGxhdGUoJy90ZW1wbGF0ZXMvJyArIGlkICsgJy5odG1sJykudGhlbihmdW5jdGlvbih0ZXh0KSB7XG5cbiAgICAgICAgdmFyIHdyYXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgICAgICB3cmFwLmlubmVySFRNTCA9IHRleHQ7XG5cbiAgICAgICAgY29udGVudC5hcHBlbmRDaGlsZCh3cmFwKTtcblxuICAgICAgICBrby5hcHBseUJpbmRpbmdzKG1vZGVsLCB3cmFwKTtcbiAgICB9KTtcbn07XG5cbi8vIFNob3dzIGluZm9ybWF0aW9uYWwgbWVzc2FnZS5cblxuZXhwb3J0cy5tZXNzYWdlID0gZnVuY3Rpb24odGV4dCwgY2xhenopIHtcblxuICAgIHZhciBtZXNzYWdlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtZXNzYWdlcycpO1xuXG4gICAgdmFyIG1lc3NhZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcblxuICAgIHZhciByZWFsQ2xhenogPSAnYWxlcnQnO1xuXG4gICAgaWYgKGNsYXp6KSB7XG5cbiAgICAgICAgcmVhbENsYXp6ICs9ICcgJyArIGNsYXp6O1xuXG4gICAgfSBlbHNlIHtcblxuICAgICAgICByZWFsQ2xhenogKz0gJyBhbGVydC1zdWNjZXNzJztcbiAgICB9XG5cbiAgICBtZXNzYWdlLmNsYXNzTmFtZSA9IHJlYWxDbGF6ejtcbiAgICBtZXNzYWdlLmlubmVySFRNTCA9IHRleHQ7XG5cbiAgICBtZXNzYWdlcy5hcHBlbmRDaGlsZChtZXNzYWdlKTtcblxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgbWVzc2FnZXMucmVtb3ZlQ2hpbGQobWVzc2FnZSk7XG5cbiAgICB9LCAyMDAwKTtcbn07XG4iLCJleHBvcnRzLmdldCA9IGZ1bmN0aW9uKHVybCkge1xuXG4gICAgdmFyIGRlZmVycmVkID0gUS5kZWZlcigpO1xuXG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgeGhyLm9wZW4oJ0dFVCcsIHVybCwgdHJ1ZSk7XG5cbiAgICB4aHIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUoSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5kYXRhKTtcblxuICAgIH0sIGZhbHNlKTtcblxuICAgIHhoci5zZW5kKCk7XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbmV4cG9ydHMucG9zdCA9IGZ1bmN0aW9uKHVybCwgZGF0YSkge1xuXG4gICAgdmFyIGRlZmVycmVkID0gUS5kZWZlcigpO1xuXG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgeGhyLm9wZW4oJ1BPU1QnLCB1cmwsIHRydWUpO1xuXG4gICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG5cbiAgICB4aHIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUoSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5kYXRhKTtcblxuICAgIH0sIGZhbHNlKTtcblxuICAgIHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuZXhwb3J0cy5wdXQgPSBmdW5jdGlvbih1cmwsIGRhdGEpIHtcblxuICAgIHZhciBkZWZlcnJlZCA9IFEuZGVmZXIoKTtcblxuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIHhoci5vcGVuKCdQVVQnLCB1cmwsIHRydWUpO1xuXG4gICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG5cbiAgICB4aHIuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUoSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KS5kYXRhKTtcblxuICAgIH0sIGZhbHNlKTtcblxuICAgIHhoci5zZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuZXhwb3J0cy5kZWxldGUgPSBmdW5jdGlvbih1cmwpIHtcblxuICAgIHZhciBkZWZlcnJlZCA9IFEuZGVmZXIoKTtcblxuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIHhoci5vcGVuKCdERUxFVEUnLCB1cmwsIHRydWUpO1xuXG4gICAgeGhyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbigpIHtcblxuICAgICAgICB2YXIgb2JqID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KTtcblxuICAgICAgICBpZiAob2JqLnN0YXR1cyA9PT0gXCJzdWNjZXNzXCIpIHtcblxuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShvYmouZGF0YSk7XG5cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KG9iaik7XG4gICAgICAgIH1cblxuICAgIH0sIGZhbHNlKTtcblxuICAgIHhoci5zZW5kKCk7XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbmV4cG9ydHMudGVtcGxhdGUgPSBmdW5jdGlvbih1cmwpIHtcblxuICAgIHZhciBkZWZlcnJlZCA9IFEuZGVmZXIoKTtcblxuICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIHhoci5vcGVuKCdHRVQnLCB1cmwsIHRydWUpO1xuXG4gICAgeGhyLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbigpIHtcblxuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHhoci5yZXNwb25zZVRleHQpO1xuXG4gICAgfSwgZmFsc2UpO1xuXG4gICAgeGhyLnNlbmQoKTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxucmV0dXJuIGV4cG9ydHM7XG4iXX0=
