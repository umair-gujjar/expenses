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
