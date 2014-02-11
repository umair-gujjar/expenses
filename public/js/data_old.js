var data = (function(exports) {

    function Effects() {

        this.map = {};

        this.update = function(code, amount) {

            this.map[code] = (this.map[code] || 0) + amount;
        };

        this.toArray = function() {

            return Object.keys(this.map).map(function(key) {

                return { account: key, effect: this.map[key] };

            }, this);
        };
    }

    var Entry = exports.Entry = function(data) {

        this.$id = ko.observable();
        this.title = ko.observable();
        this.description = ko.observable();
        this.items = ko.observableArray();

        if (data) {

            this.$id(data.$id);
            this.title(data.title);
            this.description(data.description);
            this.timestamp = data.date;

            data.items.forEach(function(item) {

                this.items.push(new Item(item));

            }, this);

        } else {

            this.timestamp = Math.floor(Date.now() / 1000);
        }

        var self = this;

        this.date = ko.computed({

            read: function() {

                return moment.unix(self.timestamp).format('DD.MM.YYYY');
            },

            write: function(value) {

                return moment(value, 'DD.MM.YYYY').unix();
            }
        });

        this.toJS = function() {

            return {

                $id: this.$id(),
                title: this.title(),
                description: this.description(),
                date: this.timestamp,

                items: this.items().map(function(item) {

                    return item.toJS();
                })
            };
        };

        this.post = function() {

            var deferred = Q.defer();

            var xhr = new XMLHttpRequest();

            xhr.open('POST', '/api/entry', true);

            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.addEventListener('load', function() {

                deferred.resolve(JSON.parse(xhr.responseText));

            }, false);

            xhr.send(JSON.stringify(this.toJS()));

            return deferred.promise;
        };

        this.addItem = function() {

            this.items.push(new Item());
        };

        // Returns array with pairs
        // { account: String, effect: Float }

        this.effects = ko.computed(function() {

            var effects = new Effects();

            this.items().forEach(function(item) {

                var amount = item.eurAmount();
                var debit = item.debit();
                var credit = item.credit();

                if (amount) {

                    if (debit) {

                        effects.update(debit.code(), debit.debit(amount));
                    }

                    if (credit) {

                        effects.update(credit.code(), credit.credit(amount));
                    }
                }
            });

            return effects.toArray();

        }, this);
    }

    Entry.all = function() {

        return XHR.get('/api/entries').then(function(entries) {

            return entries.map(function(entry) {

                return new Entry(entry);
            });
        });
    };

    var Item = exports.Item = function(data) {

        this.title = ko.observable();
        this.debit = ko.observable();
        this.credit = ko.observable();
        this.amount = ko.observable();
        this.currency = ko.observable();
        this.eurAmount = ko.observable();

        if (data) {

            this.title(data.title);
            this.debit(data.debit);
            this.credit(data.credit);
            this.amount(data.amount);
            this.currency(data.currency);
            this.eurAmount(data.eur_amount);
        }

        // Converts item into a plain JS object.

        this.toJS = function() {

            return {

                title: this.title(),
                debit: this.debit().code(),
                credit: this.credit().code(),
                amount: parseFloat(this.amount()),
                currency: this.currency(),
                eur_amount: parseFloat(this.eurAmount())
            };
        };

        // Finds amount in EUR by original amount
        // when the original currency is EUR.

        this.eurOrig = ko.computed(function() {

            var amount = this.amount();
            var currency = this.currency();

            if (amount && currency === 'EUR') {

                return amount;
            }

        }, this);

        /*
        // Updates the EUR amount field
        // when the conditions above are true.

        this.eurOrig.subscribe(function(value) {

            if (value) {

                this.eurAmount(value);
            }

        }, this);

        // Finds debit effect.

        this.debited = ko.computed(function() {

            var debit = this.debit();
            var eurAmount = this.eurAmount();

            if (debit && eurAmount) {

                return debit.debit(eurAmount);
            }

        }, this);

        // Finds credit effect.

        this.credited = ko.computed(function() {

            var credit = this.credit();
            var eurAmount = this.eurAmount();

            if (credit && eurAmount) {

                return credit.credit(eurAmount);
            }

        }, this);

        // Finds effects (textual description).

        this.effects = ko.computed(function() {

            var debited = this.debited();
            var credited = this.credited();

            if (debited && credited) {

                return this.debit() + ': ' + debited + ' EUR; ' +
                    this.credit() + ': ' + credited + ' EUR';
            }

        }, this);*/
    }

    var Account = exports.Account = function(data) {

        this.code = ko.observable();
        this.name = ko.observable();
        this.type = ko.observable();
        this.id = ko.observable();

        if (data) {

            this.code(data.code);
            this.name(data.name);
            this.type(data.type);
        }

        this.toJS = function() {

            return {

                code: this.code(),
                name: this.name(),
                type: this.type()
            };
        };

        this.debit = function(amount) {

            if (this.type() === 'liability' ||
                this.type() === 'income' ||
                this.type() === 'equity') {

                return -amount;
            }

            return amount;
        };

        this.credit = function(amount) {

            if (this.type() === 'asset' ||
                this.type() === 'expense') {

                return -amount;
            }

            return amount;
        };

        this.toString = function() {

            return this.code() + ' (' + this.name() + ')';
        };

        this.post = function() {

            var deferred = Q.defer();

            var xhr = new XMLHttpRequest();

            xhr.open('POST', '/api/account', true);

            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.addEventListener('load', function() {

                deferred.resolve(JSON.parse(xhr.responseText));

            }, false);

            xhr.send(JSON.stringify(this.toJS()));

            return deferred.promise;
        };

        this.save = function() {

            var self = this;

            if (!self.id()) {

                return self.post().then(function(response) {

                    self.id(response.data);
                });

            } else {

                return Q();
            }
        };
    }

    Account.load = function() {

        var deferred = Q.defer();

        var xhr = new XMLHttpRequest();

        xhr.open('GET', '/api/accounts', true);

        xhr.addEventListener('load', function() {

            var accounts = JSON.parse(xhr.responseText).data;

            accounts.forEach(function(account) {

                Account.accounts.push(new Account(account));
            });

            deferred.resolve();

        }, false);

        xhr.send();

        return deferred.promise;
    };

    Account.find = function(code) {

        var accounts = this.accounts();

        for (var i = 0; i < accounts.length; i++) {

            if (accounts[i].code() === code) {

                return accounts[i];
            }
        }

        throw new Error('No account ' + code);
    };

    Account.accounts = ko.observableArray();

    return exports;

})({});
