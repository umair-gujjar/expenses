var spinner = require('./spinner');

var showCount = 0;

function spinnerShow() {

    if (showCount === 0) {

        spinner.show();
    }

    showCount += 1;
}

function spinnerHide() {

    showCount -= 1;

    if (showCount === 0) {

        spinner.hide();
    }
}

function fetchGet(url) {

    spinnerShow();

    return fetch(url, {

        headers: { 'Accept': 'application/json' },

        credentials: 'same-origin'

    }).catch(function(err) {

        spinnerHide();

        throw err;

    }).then(handleResponse);
}

function fetchDelete(url) {

    spinnerShow();

    return fetch(url, {

        method: 'DELETE',

        headers: { 'Accept': 'application/json' },

        credentials: 'same-origin'

    }).catch(function(err) {

        spinnerHide();

        throw err;

    }).then(handleResponse);
}

function fetchSave(url, data) {

    spinnerShow();

    return fetch(url, {

        method: 'POST',

        headers: {

            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },

        credentials: 'same-origin',

        body: JSON.stringify(data)

    }).catch(function(err) {

        spinnerHide();

        throw err;

    }).then(handleResponse);
}

function fetchUpdate(url, data) {

    spinnerShow();

    return fetch(url, {

        method: 'PUT',

        headers: {

            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },

        credentials: 'same-origin',

        body: JSON.stringify(data)

    }).catch(function(err) {

        spinnerHide();

        throw err;

    }).then(handleResponse);
}

function handleResponse(response) {

    spinnerHide();

    return response.json().then(function(json) {

        if (json.status === 'success') {

            return json.data;

        } else {

            throw new Error('API response is not success: ' + json.message);
        }
    });
}

exports.entry = {

    full: function(id) {

        return fetchGet('/api/entry/' + encodeURIComponent(id) + '/full');
    },

    get: function(id) {

        return fetchGet('/api/entry/' + encodeURIComponent(id));
    },

    list: function(start, end) {

        var url = '/api/entries/' + encodeURIComponent(start) +
            '/' + encodeURIComponent(end);

        return fetchGet(url);
    },

    remove: function(id) {

        return fetchDelete('/api/entry/' + encodeURIComponent(id));
    },

    update: function(id, data) {

        return fetchUpdate('/api/entry/' + encodeURIComponent(id), data);
    },

    save: function(data) {

        return fetchSave('/api/entry', data);
    }
};

exports.account = {

    all: function() {

        return fetchGet('/api/accounts');
    },

    items: function(id, start, end) {

        var url = '/api/account/' + encodeURIComponent(id) + '/items/' +
            encodeURIComponent(start) + '/' + encodeURIComponent(end);

        return fetchGet(url);
    },

    get: function(id) {

        return fetchGet('/api/account/' + encodeURIComponent(id));
    },

    update: function(id, data) {

        return fetchUpdate('/api/account/' + encodeURIComponent(id), data);
    },

    save: function(data) {

        return fetchSave('/api/account', data);
    },

    remove: function(id) {

        return fetchDelete('/api/account/' + encodeURIComponent(id));
    }
};

exports.cash = {

    list: function(start, end) {

        var url = '/api/cash/' + encodeURIComponent(start) +
            '/' + encodeURIComponent(end);

        return fetchGet(url);
    }
};
