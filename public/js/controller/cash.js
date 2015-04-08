var fs = require('fs');
var api = require('../lib/api');
var view = require('../lib/view');
var period = require('../lib/period');

var cashTemplate = fs.readFileSync(__dirname +
    '/../../templates/cash.html', { encoding: 'utf8' });

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

        view.show(cashTemplate, { items: items, summary: sumList });
    });
};
