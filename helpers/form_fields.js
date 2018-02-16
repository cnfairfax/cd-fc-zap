const parseXML = require('xml2js-es6-promise');
const parseXMLSync = require('xml2js-parser').parseStringSync;
const Promise = require('bluebird');

module.exports = (z, bundle) => {
  z.console.log(JSON.stringify(bundle.inputData));
  // fetch form capture fields associated with the form capture record
  return z.request({
    url: 'https://' + bundle.authData.subdomain + '.clickdimensions.com/Service.svc/v1/account/' + bundle.authData.account_key + '/captures/' + bundle.inputData.form_capture_id + '/fields',
    method: 'GET'
  }).then((response) => {
    // throw error if status > 300
      response.throwForStatus();
      // synchronous XML parser
      return parseXMLSync(response.content);
  }).then(function(js) {
      // check if the FormCaptureField attribute is an array, if so, carry on
      if(Array.isArray(js.FormCaptureFields.FormCaptureField)) {
        var Fields = js.FormCaptureFields.FormCaptureField;
        var requests = [];
        // for each field in Fields, fire off a request to get the FormField object
        for(var i = 0; i < Fields.length; i++) {
          z.console.log(Fields[i]);
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
          z.console.log(JSON.stringify(bundle.inputData));
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