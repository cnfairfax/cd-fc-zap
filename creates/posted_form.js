var parseXML = require('xml2js-es6-promise');
const parseXMLSync = require('xml2js-parser').parseStringSync;
var hydrateFormField = require('../hydrators/form_fields.js');
var Promise = require('bluebird');

// definte the generator for the form capture field fields
var getFormFields = (z, bundle) => {
  // fetch form capture fields associated with the form capture record
  return z.request({
    url: 'https://' + bundle.authData.subdomain + '.clickdimensions.com/Service.svc/v1/account/' + bundle.authData.account_key + '/captures/' + bundle.inputData.form_capture_id + '/fields',
    method: 'GET'
  }).then((response) => {
    // throw error if status > 300
      response.throwForStatus();
      // promise-based XML parser, return promise to next then statement
      return parseXML(response.content);
  }).then(function(js) {
      // check if the FormCaptureField attribute is an array, if so, carry on
      if(Array.isArray(js.FormCaptureFields.FormCaptureField)) {
        var Fields = js.FormCaptureFields.FormCaptureField;
        var requests = [];
        // for each field in Fields, fire off a request to get the FormField object
        for(var i = 0; i < Fields.length; i++) {
          requests[i] = z.request({
            url: 'https://' + bundle.authData.subdomain + '.clickdimensions.com/Service.svc/v1/account/' + bundle.authData.account_key + '/formfields/' + Fields[i].FormFieldKey,
            method: 'GET'
          });
        }
        // catch all FormField requests in promise.all and wait for all of them to complete, then process the array of values returned
        return Promise.all(requests).then((values) => {
          // create allFields, this is the array of fields that will be returned to Zapier
          var allFields = [];
          // Parse the XML returned by each request and put it in its proper spot in its respective object within allFields
          for (var j = 0; j < Fields.length; j++) {
            // all other XML parses are async. this is a different library to handle 
            // a synchronous parse because we're already in return Hell as it is...
            var hydroField = parseXMLSync(values[j].content);
            // if there is no issue with this request, populate the field data as it should be
            if(values[j].status < 300) {
              Fields[j]['formFieldID'] = hydroField.FormField.FormFieldId;
            } else {
              // if there was an error, create a custom field to communicate that error to the customer
              Fields[j]['formFieldID'] = j;
              Fields[j].FormFieldLabel = 'There was an error collecting this field: ' + hydroField.Error.Message + '. Refresh fields to try again.';
            }
            // Set up this instance of allFields
            allFields[j] = {
              key: Fields[j].formFieldID[0],
              label: Fields[j].FormFieldLabel[0],
              required: Fields[j].Required[0]
            }
          }
          // return that ISH!
          return allFields;
        }).catch((err) => { 
          z.console.log(err) 
          throw new Error(err);
        });
      } else {
        // if the result is not an array, build custom field 
        // notifying customer of error and return that field
        
        js.FormCaptureFields['FormCaptureField'] = {};
        js.FormCaptureFields.FormCaptureField['no_fields_error']  = 'There are no Form Capture Fields associated with this Form Capture. Please associate Form Capture Fields to this Form Capture in your CRM and then try again.';
        js.FormCaptureFields.FormCaptureField['id'] = '1';

        var field = js.FormCaptureFields;
        return [{key: field.FormCaptureField.id, label: 'There was a problem fetching your form fields: ' + field.FormCaptureField.no_fields_error}]
      }
    });
}

module.exports = {
  key: 'posted_form',
  noun: 'Posted Form',
  display: {
    label: 'Create a Posted Form Record',
    description: 'Creates a posted form record for your Form Capture.'
  },
  operation: {
    inputFields: [
      {key: 'form_capture_id', required: true, label: 'Form Capture', dynamic: 'form_captureList.Key.Name'},
      {key: 'post_url', required: true, label: 'Post URL', helpText: 'This is the URL that your Form Capture posts to. It can be found in the Location field on the Form Catpure record', placeholder: 'http://example.url'},
      {key: 'success_url', required: true, label: 'Success URL', helpText: 'This is the redirect URL for a successful form submission. This can be found on the Form Capture record in your CRM.', placeholder: 'http://example.url'},
      {key: 'error_url', required: true, label: 'Error URL', helpText: 'This is the redirect URL for an errored form submission. This can be found on the Form Capture record in your CRM.', placeholder: 'http://example.url'},
      {key: 'domain', required: true, label: 'Website Domain', helpText: 'This is the Source URL of the form posted to Zapier.'},
      {key: 'cd_visitorkey', required: true, label: 'CUVID Key', helpText: 'This is the Visitor ID found in the CUVID cookie'},
      getFormFields
    ],
    perform: (z, bundle) => {
      var postedData = {};
      Object.keys(bundle.inputData).forEach(function(key) {
        if(key != 'success_url' || key != 'error_url' || key != 'form_capture_id' || key != 'post_url' || key != 'domain') {
          postedData[key] = bundle.inputData[key];
        }
      });
      z.console.log('SENDING THIS: ' + JSON.stringify(postedData));
      return z.request({
        url: bundle.inputData.post_url,
        method: 'POST',
        form: postedData,
        redirect: 'manual',
        headers: {
          'Referer': bundle.inputData.domain
        }
      }).then((response) => {
        if(response.getHeader('location') == bundle.inputData.success_url || response.getHeader('location').slice(0, -1) == bundle.inputData.success_url) {
          return postedData;
        } else if (response.getHeader('location') == bundle.inputData.error_url || response.getHeader('location').slice(0, -1) == bundle.inputData.error_url) {
          throw new Error('OOOPS');
        }
      });
    },
    sample: {
      id: 1,
      form_capture_id: 111111111,
      success: true,
      cd_visitorkey: 2222222,
      formfields: {
        firstName: 'Jimmy',
        lastName: 'Stewart',
        emailAddress: 'jstewart@email.com'
      }
    },
    // Function defines where to get output fields
    outputFields: [
      {key: 'id', label: 'ID'},
      {key: 'createdAt', label: 'Created At'},
      {key: 'name', label: 'Name'},
      {key: 'directions', label: 'Directions'},
      {key: 'authorId', label: 'Author ID'},
      {key: 'style', label: 'Style'}
    ]
  }
};
