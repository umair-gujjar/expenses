var fs = require('fs');
var cash = require('./controller/cash');
var entry = require('./controller/entry');
var account = require('./controller/account');
var view = require('./lib/view');
var period = require('./lib/period');
var money = require('./lib/money');
var date = require('./lib/date');
var handle_error = require('./lib/handle_error');

// Errors binding.

require('./lib/form_error');

window.formatDate = function(unix) {

    return date.format(unix);
};

window.formatAmount = function(amount) {

    return money.format(amount);
};

route(/^entries/, function() {

    entry.list().catch(handle_error);
});

route(/^expanded/, function() {

    entry.expanded().catch(handle_error);
});

route(/^entry\/edit\/([a-z0-9\-]+)/, function(id) {

    entry.edit(id).catch(handle_error);
});

route(/^entry\/copy\/([a-z0-9\-]+)/, function(id) {

    entry.copy(id).catch(handle_error);
});

route(/^entry\/view\/([a-z0-9\-]+)/, function(id) {

    entry.view(id).catch(handle_error);
});

route(/^entry\/add/, function() {

    entry.add().catch(handle_error);
});

route(/^accounts/, function() {

    account.list().catch(handle_error);
});

route(/^account\/add/, function() {

    account.add().catch(handle_error);
});

route(/^account\/edit\/(.+)/, function(id) {

    account.edit(id).catch(handle_error);
});

route(/^account\/(.+)\/items/, function(id) {

    account.items(id).catch(handle_error);
});

route(/^cash/, function() {

    cash.show().catch(handle_error);
});

var helpTemplate = fs.readFileSync(__dirname +
    '/../templates/help.html', { encoding: 'utf8' });

route(/^help/, function() {

    view.show(helpTemplate, {});
});

route(/.*/, function() {

    route.go('entries');
});

var periodForm = document.getElementById('period');

ko.applyBindings(period, periodForm);
