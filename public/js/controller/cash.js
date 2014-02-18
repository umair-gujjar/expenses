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
