var data = (function(exports) {

    function findAccount(accounts, id) {

        for (var i = 0; i < accounts.length; i++) {

            if (accounts[i].$id === id) {

                return accounts[i];
            }
        }

        throw new Error('No account ' + id);
    }

    function debitAmount(account, amount) {

        if (account.type === 'liability' ||
            account.type === 'income' ||
            account.type === 'equity') {

            return -amount;
        }

        return amount;
    }

    function creditAmount(account, amount) {

        if (account.type === 'asset' ||
            account.type === 'expense') {

            return -amount;
        }

        return amount;
    }

    function itemVM(accounts, data) {

        var item = {

            title: ko.observable(),
            debit: ko.observable(),
            credit: ko.observable(),
            currency: ko.observable(),
            amount: ko.observable().extend({ number: true }),
            eur_amount: ko.observable().extend({ number: true })
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

        item.debited = ko.computed(function() {

            var debit = item.debit();
            var eur_amount = item.eur_amount();

            if (debit && eur_amount) {

                return debitAmount(debit, eur_amount);
            }

        });

        item.credited = ko.computed(function() {

            var credit = item.credit();
            var eur_amount = item.eur_amount();

            if (credit && eur_amount) {

                return creditAmount(credit, eur_amount);
            }

        });

        item.toJS = function() {

            return {

                title: item.title(),
                debit: item.debit().$id,
                credit: item.credit().$id,
                amount: parseFloat(item.amount()),
                currency: item.currency().toLowerCase(),
                eur_amount: parseFloat(item.eur_amount())
            };
        };

        if (data) {

            item.title(data.title);
            item.debit(findAccount(accounts, data.debit));
            item.credit(findAccount(accounts, data.credit));
            item.amount(data.amount);
            item.currency(data.currency.toUpperCase());
            item.eur_amount(data.eur_amount);
        }

        return item;
    }

    exports.entryVM = function(accounts, data) {

        var entry = {

            accounts: accounts,
            currencies: ['EUR', 'USD', 'GBP'],
            title: ko.observable(),
            date: ko.observable(),
            $id: null,
            items: ko.observableArray([]),
            addItem: function() {

                entry.items.push(itemVM(accounts));
            }
        };

        entry.effects = ko.computed(function() {

            map = {};

            entry.items().forEach(function(item) {

                var amount = item.eur_amount();
                var debit = item.debit();
                var credit = item.credit();

                if (amount) {

                    if (debit) {

                        map[debit.code] = (map[debit.code] || 0) + debitAmount(debit, amount);
                    }

                    if (credit) {

                        map[credit.code] = (map[credit.code] || 0) + creditAmount(credit, amount);
                    }
                }
            });

            return Object.keys(map).map(function(key) {

                return { account: key, effect: map[key] };

            });

        });

        entry.toJS = function() {

            console.log(entry.date());

            return {

                title: entry.title(),
                date: moment(entry.date(), 'DD.MM.YYYY').unix(),
                items: entry.items().map(function(item) {

                    return item.toJS();
                })
            };
        };

        if (data) {

            entry.$id = data.$id;
            entry.title(data.title);
            entry.date(moment.unix(data.date).format('DD.MM.YYYY'));

            data.items.forEach(function(item) {

                entry.items.push(itemVM(accounts, item));
            });

        } else {

            entry.date(moment().format('DD.MM.YYYY'));
        }

        return entry;
    };

    exports.accountVM = function(data) {

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

        account.debit = function(amount) {

            if (account.type() === 'liability' ||
                account.type() === 'income' ||
                account.type() === 'equity') {

                return -amount;
            }

            return amount;
        };

        account.credit = function(amount) {

            if (account.type() === 'asset' ||
                account.type() === 'expense') {

                return -amount;
            }

            return amount;
        };

        account.toString = function() {

            return account.code() + ' (' + account.name() + ')';
        };

        return account;
    };

    return exports;

})({});
