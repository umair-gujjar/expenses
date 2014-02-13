var XHR = require('./xhr');

exports.entry = {

    full: function(id) {

        return XHR.get('/api/entry/' + id + '/full');
    },

    get: function(id) {

        return XHR.get('/api/entry/' + id);
    },

    list: function(start, end) {

        var url = '/api/entries/' + start + '/' + end;

        return XHR.get(url);
    },

    remove: function(id) {

        return XHR.delete('/api/entry/' + id);
    },

    update: function(id, data) {

        return XHR.put('/api/entry/' + id, data);
    },

    save: function(data) {

        return XHR.post('/api/entry', data);
    }
};

exports.account = {

    all: function() {

        return XHR.get('/api/accounts');
    },

    items: function(id, start, end) {

        var url = '/api/account/' + id + '/items/' +
            start + '/' + end;

        return XHR.get(url);
    },

    get: function(id) {

        return XHR.get('/api/account/' + id);
    },

    update: function(id, data) {

        return XHR.put('/api/account/' + id, data);
    },

    save: function(data) {

        return XHR.post('/api/account', data);
    },

    remove: function(id) {

        return XHR.delete('/api/account/' + id);
    }
};
