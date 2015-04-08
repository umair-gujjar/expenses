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
        copy: copy,
        errors: {
            title: ko.observableArray([])
        }
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

        entry.errors.title([]);

        entry.items().forEach(function(item) {

            item.errors.title([]);
            item.errors.date([]);
            item.errors.debit([]);
            item.errors.credit([]);
            item.errors.currency([]);
            item.errors.amount([]);
            item.errors.eur_amount([]);
        });
    }

    function validate() {

        cleanErrors();

        var years = [];

        if (!entry.title()) {

            entry.errors.title.push('Entry title must be set.');
        }

        // Fresh entries can only be added to
        // currently selected year.

        entry.items().forEach(function(item) {

            item.validate(!entry.$id);

            years.push(item.year());
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

        var error = document.querySelector('form .exp-input-error');

        if (error) {

            error.focus();
        }

        return !error;
    }

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
            
            entry.items.remove(item);
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
            title: ko.observableArray([]),
            date: ko.observableArray([]),
            debit: ko.observableArray([]),
            credit: ko.observableArray([]),
            currency: ko.observableArray([]),
            amount: ko.observableArray([]),
            eur_amount: ko.observableArray([])
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
            date: Math.floor(date.parse(item.date()).getTime() / 1000),
            debit: item.debit(),
            credit: item.credit(),
            amount: money.parse(item.amount()),
            currency: item.currency().toLowerCase(),
            eur_amount: money.parse(item.eur_amount())
        };
    };

    // Finds current item year.

    item.year = ko.pureComputed(function() {

        var parsed = date.parse(item.date());

        return parsed ? parsed.getUTCFullYear() : null;
    });

    item.validate = function(fresh) {

        if (!item.title()) {

            item.errors.title.push('Item title must be set.');
        }

        if (!item.date()) {

            item.errors.date.push('Item has no date set.');

        } else {

            var parsed = date.parse(item.date());

            if (!parsed) {

                item.errors.date.push('Item has invalid date.');

            } else {

                if (item.year() !== parseInt(period.year(), 10) && fresh) {

                    item.errors.date.push('Items can only be added to the currently selected year.');
                }
            }
        }

        if (!item.debit()) {

            item.errors.debit.push('Item debit account must be set.');
        }

        if (!item.credit()) {

            item.errors.credit.push('Item credit account must be set.');
        }

        if (!item.currency()) {

            item.errors.currency.push('Item currency must be set.');
        }

        if (!item.amount()) {

            item.errors.amount.push('Item original amount must be set.');

        } else if (isNaN(parseFloat(item.amount()))) {

            item.errors.amount.push('Item original amount must be a number.');
        }

        if (!item.eur_amount()) {

            item.errors.eur_amount.push('Item EUR amount must be set.');

        } else if (isNaN(item.eur_amount())) {

            item.errors.eur_amount.push('Item EUR amount must be a number.');
        }
    };

    return item;
}
