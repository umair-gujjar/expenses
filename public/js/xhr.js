var XHR = (function(exports) {

    exports.get = function(url) {

        var deferred = Q.defer();

        var xhr = new XMLHttpRequest();

        xhr.open('GET', url, true);

        xhr.addEventListener('load', function() {

            deferred.resolve(JSON.parse(xhr.responseText).data);

        }, false);

        xhr.send();

        return deferred.promise;
    };

    exports.post = function(url, data) {

        var deferred = Q.defer();

        var xhr = new XMLHttpRequest();

        xhr.open('POST', url, true);

        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.addEventListener('load', function() {

            deferred.resolve(JSON.parse(xhr.responseText).data);

        }, false);

        xhr.send(JSON.stringify(data));

        return deferred.promise;
    };

    exports.put = function(url, data) {

        var deferred = Q.defer();

        var xhr = new XMLHttpRequest();

        xhr.open('PUT', url, true);

        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.addEventListener('load', function() {

            deferred.resolve(JSON.parse(xhr.responseText).data);

        }, false);

        xhr.send(JSON.stringify(data));

        return deferred.promise;
    };

    exports.delete = function(url) {

        var deferred = Q.defer();

        var xhr = new XMLHttpRequest();

        xhr.open('DELETE', url, true);

        xhr.addEventListener('load', function() {

            var obj = JSON.parse(xhr.responseText);

            if (obj.status === "success") {

                deferred.resolve(obj.data);

            } else {

                deferred.reject(obj);
            }

        }, false);

        xhr.send();

        return deferred.promise;
    };

    exports.template = function(url) {

        var deferred = Q.defer();

        var xhr = new XMLHttpRequest();

        xhr.open('GET', url, true);

        xhr.addEventListener('load', function() {

            deferred.resolve(xhr.responseText);

        }, false);

        xhr.send();

        return deferred.promise;
    };

    return exports;

})({});
