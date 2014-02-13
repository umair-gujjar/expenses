exports.parse = function(text) {

    var match = text.match(/(\d{2})\.(\d{2})\.(\d{4})/);

    if (match) {

        var monthDate = parseInt(match[1], 10);
        var month = parseInt(match[2], 10) - 1;
        var year = parseInt(match[3], 10);

        var date = new Date();

        date.setUTCHours(0, 0, 0, 0);
        date.setUTCFullYear(year, month, monthDate);

        return Math.floor(date.getTime() / 1000);

    } else {

        throw new Error('Cannot parse date ' + text);
    }
};

exports.format = function(unix) {

    var date = new Date(unix * 1000);

    var year = date.getUTCFullYear();
    var month = date.getUTCMonth() + 1;
    var day = date.getUTCDate();

    function pad(x) {

        return x < 10 ? '0' + x : '' + x;
    }

    return pad(day) + '.' + pad(month) + '.' + year;
};
