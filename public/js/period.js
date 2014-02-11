var period = (function(exports) {

    function parseMonth(string) {

        var match = string.match(/(\d{2})\.(\d{4})/);

        var month = match[1];
        var year = match[2];

        if (month.charAt(0) === '0') {

            month = month.substring(1);
        }

        return {

            month: parseInt(month, 10) - 1,
            year: parseInt(year, 10)
        };
    }

    function parseStartMonth(string) {

        var month = parseMonth(string);

        var date = new Date();

        date.setUTCFullYear(month.year, month.month, 1);
        date.setUTCHours(0, 0, 0, 0);

        return Math.floor(date.getTime() / 1000);
    }

    function parseEndMonth(string) {

        var month = parseMonth(string);

        if (month.month === 11) {

            month.month = 0;
            month.year += 1;

        } else {

            month.month += 1;
        }

        var date = new Date();

        date.setUTCFullYear(month.year, month.month, 1);
        date.setUTCHours(0, 0, 0, 0);

        // One day before start of the next month.

        return Math.floor(date.getTime() / 1000) - 1;
    }

    exports.months = [];
    exports.start_month = ko.observable();
    exports.end_month = ko.observable();

    exports.start = function() {

            return parseStartMonth(this.start_month());
    };

    exports.end = function() {

            return parseEndMonth(this.end_month());
    };

    exports.update = function() {

        route.refresh();
    };

    var currentDate = new Date();
    var currentYear = currentDate.getUTCFullYear();
    var currentMonth = currentDate.getUTCMonth();

    for (var y = 2012; y <= currentYear + 1; y++) {

        for (var m = 1; m <= 12; m++) {

            exports.months.push(pad(m) + '.' + y);
        }
    }

    function pad(n) {

        return n < 10 ? '0' + n : n;
    }

    var selectedMonth = pad(currentMonth + 1) + '.' + currentYear;

    exports.start_month(selectedMonth);
    exports.end_month(selectedMonth);

    return exports;

})({});
