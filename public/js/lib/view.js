var XHR = require('./xhr');

// Shows template (by id) with the given model

exports.show = function(id, model) {

    var content = document.getElementById('content');

    if (content.children.length === 1) {

        // Something was previously shown,
        // remove it.

        ko.removeNode(content.children[0]);
    }

    // Load template, turn into DOM, bind with KnockoutJS.

    return XHR.template('/templates/' + id + '.html').then(function(text) {

        var wrap = document.createElement('div');

        wrap.innerHTML = text;

        content.appendChild(wrap);

        ko.applyBindings(model, wrap);
    });
};

// Shows informational message.

exports.message = function(text, clazz) {

    var messages = document.getElementById('messages');

    var message = document.createElement('div');

    var realClazz = 'alert';

    if (clazz) {

        realClazz += ' ' + clazz;

    } else {

        realClazz += ' alert-success';
    }

    message.className = realClazz;
    message.innerHTML = text;

    messages.appendChild(message);

    setTimeout(function() {

        messages.removeChild(message);

    }, 2000);
};
