exports.parse = function(string) {

    var match = string.match(/^\-?(\d+)(?:\.(\d{2}))?$/);

    if (match) {

        var integerPart = parseInt(match[1], 10);
        var fractionalPart = 0;

        if (match[2]) {

            fractionalPart = parseInt(match[2], 10);
        }

        var neg = string.charAt(0) === '-';

        return integerPart * 100 + fractionalPart;

    } else {

        throw new Error('Cannot parse ' + string);
    }
};

exports.format = function(value) {

    var neg = false;

    if (value < 0) {

        neg = true;
        value = -value;
    }

    var integerPart = Math.floor(value / 100);
    var fractionalPart = value % 100;

    return (neg ? '-' : '') + integerPart + '.' +
        ((fractionalPart < 10 ? '0' : '') + fractionalPart);
};
