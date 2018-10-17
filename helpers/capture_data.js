const parseXML = require('xml2js-es6-promise');
const Promise = require('bluebird');
const To = require('./To.js');

module.exports = async (z, bundle) => {
    // Get the formcapture's Action URL, and Success/Error redirect URLs
    try {
        var [getErr, res] = await To(z.request({
            url: 'https://' + bundle.authData.subdomain + '.clickdimensions.com/Service.svc/v1/account/' + bundle.authData.account_key + '/captures/' + bundle.inputData.form_capture_id,
            method: 'GET'
        }));
        if(getErr) throw new Error(getErr)

        res.throwForStatus();
        var [parseErr, data] = await To(parseXML(res.content));
        if(parseErr) throw new Error(parseErr);

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
    }
    catch (err) {
        throw new Error(err);
    }
}