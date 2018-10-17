const parseXML = require('xml2js-es6-promise');
const parseXMLSync = require('xml2js-parser').parseStringSync;
const Promise = require('bluebird');
const To = require('./To.js');

module.exports = async (z, bundle) => {
    // Refactor to async/await To(promise) pattern - easier to read - bundle errors in single try/catch
    return z.request({
        url: 'https://' + bundle.authData.subdomain + '.clickdimensions.com/Service.svc/v1/account/' + bundle.authData.account_key + '/captures/' + bundle.inputData.form_capture_id,
        method: 'GET'
    }).then((res) => {
        res.throwForStatus();
        return parseXMLSync(res.content);
    }).then((data) => {
        var location = data.FormCapture.Location[0].split(':');
        if(location[0] !== 'https') {
            location[0] = 'https'
        }
        location = location.join(':');
        var success = data.FormCapture.SuccessLocation[0];
        var error = data.FormCapture.ErrorLocation[0];
        
        var captureFields = [
            {
                key: 'post_url',
                label: 'Post URL',
                helpText: 'This is the URL that your Form Capture posts to. It can be found in the Location field on the Form Catpure record',
                computed: true,
                default: location
            },
            {
                key: 'success_url',
                label: 'Success URL',
                helpText: 'This is the redirect URL for a successful form submission. This can be found on the Form Capture record in your CRM.',
                computed: true,
                default: success
            },
            {
                key: 'error_url',
                label: 'Error URL',
                helpText: 'This is the redirect URL for an errored form submission. This can be found on the Form Capture record in your CRM.',
                computed: true,
                default: error
            }
        ];
        
        return captureFields;
    })
}