var money = require('../../lib/money');
var date = require('../../lib/date');
var view = require('../../lib/view');
var api = require('../../lib/api');
var period = require('../../lib/period');
var handle_error = require('../../lib/handle_error');

module.exports = function(accounts, data, copy) {

    var entry = {

        title: ko.observable(),
        $id: null,
        items: ko.observableArray([]),
        accounts: accounts,
        currencies: ['EUR', 'USD', 'GBP'],
        copy: copy
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

    function cleanErrors() {

        entry.items().forEach(function(item) {

            item.errors.date([]);
        });
    }

    function validate() {

        cleanErrors();

        var years = [];

        // Fresh entries can only be added to
        // currently selected year.

        entry.items().forEach(function(item) {

            var d = new Date(date.parse(item.date()) * 1000);

            var y = d.getUTCFullYear();

            years.push(y);

            if (y.toString() !== period.year() && !entry.$id) {

                item.errors.date.push('Items can only be added to the currently selected year.');
            }
        });

        var crossYear = false;

        for (var i = 1; i < years.length; i++) {

            if (years[i] !== years[i - 1]) {

                crossYear = true;

                break;
            }
        }

        if (crossYear) {

            entry.items().forEach(function(item) {

                item.errors.date.push('Cross-year entries cannot be added.');
            });
        }

        return !document.querySelector('form .exp-input-error');
    };

    entry.save = function() {

        if (!validate()) {

            return;
        }

        if (entry.$id) {

            api.entry.update(entry.$id, entry.toJS()).then(function() {

                window.location.hash = '#entry/view/' + entry.$id;

            }).catch(handle_error);

        } else {

            api.entry.save(entry.toJS()).then(function(data) {

                window.location.hash = '#entry/view/' + data;

            }).catch(handle_error);
        }

        view.message('The entry is saved.');
    };

    entry.remove = function() {

        if (entry.$id) {

            if (confirm('Remove the entry?')) {

                api.entry.remove(entry.$id).then(function() {

                    window.location.hash = '#entries';

                    view.message('The entry is deleted.');

                }).catch(handle_error);
            }
        }
    };

    entry.addItem = function() {

        var items = entry.items(), item = itemVM();

        if (items.length > 0) {

            // Set date automatically from last
            // item date.

            item.date(items[items.length - 1].date());
        }

        entry.items.push(item);
    };

    entry.removeItem = function(item) {

        if (confirm('Remove the item ' + item.title() + '?')) {
            
            entry.items.remove(item).catch(handle_error);
        }
    };

    return entry;
};

function itemVM(data) {

    var item = {

        title: ko.observable(),
        date: ko.observable(),
        debit: ko.observable(),
        credit: ko.observable(),
        currency: ko.observable(),
        amount: ko.observable(),
        eur_amount: ko.observable(),
        errors: {
            date: ko.observableArray([])
        }
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
}
