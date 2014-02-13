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

route(/^help/, function() {

    view.show('help', {}).done();
});

route(/.*/, function() {

    route.go('entries');
});

var periodForm = document.getElementById('period');

ko.applyBindings(period, periodForm);
