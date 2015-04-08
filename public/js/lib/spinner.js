exports.show = function() {

    var spinner = document.getElementById('spinner');

    if (!spinner) {

        return;
    }

    spinner.style.display = 'block';
};

exports.hide = function() {

    var spinner = document.getElementById('spinner');

    if (!spinner) {

        return;
    }

    spinner.style.display = 'none';
};
