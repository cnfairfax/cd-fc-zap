const parseXML = require('xml2js-es6-promise');

module.exports = (z, bundle, obj) => {
    return new Promise(function(resolve, reject) {
        z.request({
            url: 'https://' + bundle.authData.subdomain + '.clickdimensions.com/Service.svc/v1/account/' + bundle.authData.account_key + '/formfields/' + obj.formFieldKey,
            method: 'GET'
        }).then((response) => {
            if(response.status < 300) {
                parseXML(response.content).then((result) => {
                    z.console.log(JSON.stringify(result));
                    z.console.log('About to return another form field:\n' + result.FormField.FormFieldID);
                    resolve(result.FormField.FormFieldID);
                });
            }
        });
    });
}