const includeAuthHeader = function (request, z, bundle) {

    var SERVICETOKEN = bundle.authData.token;
    var uri = request.url;
    uri = uri.replace('https://{{bundle.authData.subdomain}}.clickdimensions.com', '');
    
    function getAuth(token, uri) {
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