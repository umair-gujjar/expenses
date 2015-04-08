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
    };

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

            }).catch(handle_error);

        } else {

            api.account.save(account.toJS()).done(function() {

                window.location.hash = '#accounts';

            }).catch(handle_error);
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

                }).catch(handle_error);
            }
        }
    };

    return account;
};
