const includeAuthHeader = function (request, z, bundle) {
    //gather token, subdomain, and the request URL
    var SERVICETOKEN = bundle.authData.token;
    var subD = bundle.authData.subdomain;
    var uri = request.url;
    
    function getAuth(token, uri) {
        z.console.log('SUBDOMAIN: ' + subD);
        //modify uri within getAuth because closures...
        uri = uri.replace('https://' + bundle.authData.subdomain + '.clickdimensions.com', '');
        //pageSize, action, and userid should be the only parameters provided and there should only ever be one.
        if (Object.keys(request.params).length >= 2) {
            throw new Error('Too many parameters in the request URL');
        }
        // add request parameter to uri to generate key
        if(request.params['pageSize']) {
            var size = request.params['pageSize'];
            uri += '?pageSize=' + size;
        } else if(request.params['userid']) {
            var id = request.params['userid'];
            uri += '?userid=' + id;
        } else if(request.params['action']) {
            var action = request.params['action'];
            uri += '?action=' + action;
        }
        var crypto = require('crypto');
        const key = Buffer.from(token, 'ascii');
        var uriDec = decodeURI(uri);
        const message = Buffer.from(uriDec, 'ascii');
        const hmac = crypto.createHmac('md5', key);
        hmac.update(message);
        const auth = hmac.digest('base64');
        return auth;
    }
    
    request.headers['Authorization'] = getAuth(SERVICETOKEN, uri);
    
    return request;
}

module.exports = includeAuthHeader;