var parseXML = require('xml2js-es6-promise');
var hydrateFormField = require('../hydrators/form_fields.js');

// definte the generator for the form capture field fields
var getFormFields = (z, bundle) => {
  // fetch form capture fields associated with the form capture record
  return z.request({
    url: 'https://' + bundle.authData.subdomain + '.clickdimensions.com/Service.svc/v1/account/' + bundle.authData.account_key + '/captures/' + bundle.inputData.form_capture + '/fields',
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
        // This is my problem. How do I inline the requests created by this loop?!
        for(var i = 0; i < Fields.length; i++) {
          Fields[i]['formFieldID'] = z.request({
            url: 'https://' + bundle.authData.subdomain + '.clickdimensions.com/Service.svc/v1/account/' + bundle.authData.account_key + '/formfields/' + Fields[i].formFieldKey,
            method: 'GET'
          }).then((response) => {
            if(response.status < 300) {
                return parseXML(response.content).then((result) => {
                    return result.FormField.FormFieldID;
                });
            }
        });
        }
        return Fields;
      } else {
        // if the result is not an array, build custom field 
        // notifying customer of error and return that field
        z.console.log('We got to the else statement!');
        
        js.FormCaptureFields['FormCaptureField'] = {};
        js.FormCaptureFields.FormCaptureField['no_fields_error']  = 'There are no Form Capture Fields associated with this Form Capture. Please associate Form Capture Fields to this Form Capture in your CRM and then try again.';
        js.FormCaptureFields.FormCaptureField['id'] = '1';

        z.console.log('JUST BEFORE RETURN IN ELSE: ' + js.FormCaptureFields.FormCaptureField.no_fields_error);
        return js.FormCaptureFields;
      }
    }).then(function(results) {
      z.console.log('RESULTS:' + JSON.stringify(results));
      // process results with finalOutput and then return 
      // the return value of final Output to generate form fields. 
      // Form fields should be an array of 1 or more objects
      function finalOutput(v) {
        if(v.FormCaptureField) {
          return [{key: v.id, label: 'There was a problem fetching your form fields: ' + v.FormCaptureField.no_fields_error}]
        } else {
          var allFields = [];
          v.forEach(function(field, i) {
            allFields[i] = {
              key: field.formFieldID,
              label: field.FormFieldLabel,
              required: field.Required
            };
          });
          z.console.log('THIS SHOULD BE ALL THE FIELDS:\n' + JSON.stringify(allFields));
          return allFields;
        }
      }
      return finalOutput(results);
    });
}

module.exports = {
  key: 'posted_form',

  // You'll want to provide some helpful display labels and descriptions
  // for users. Zapier will put them into the UX.
  noun: 'Posted Form',
  display: {
    label: 'Create a Posted Form Record',
    description: 'Creates a posted form record for your Form Capture.'
  },

  // `operation` is where the business logic goes.
  operation: {
    inputFields: [
      {key: 'form_capture', required: true, label: 'Form Capture', dynamic: 'form_captureList.Key.Name'},
      {key: 'success', required: true, label: 'Success URL', helpText: 'This is the redirect URL for a successful form submission. This can be found on the Form Capture record in your CRM.', placeholder: 'http://example.url'},
      {key: 'error', required: true, label: 'Error URL', helpText: 'This is the redirect URL for an errored form submission. This can be found on the Form Capture record in your CRM.', placeholder: 'http://example.url'},
      {key: 'post_url', required: true, label: 'Post URL', helpText: 'This is the URL that your Form Capture posts to. It can be found in the Location field on the Form Catpure record', placeholder: 'http://example.url'},
      getFormFields
    ],
    perform: (z, bundle) => {
      
    },
    
    // In cases where Zapier needs to show an example record to the user, but we are unable to get a live example
    // from the API, Zapier will fallback to this hard-coded sample. It should reflect the data structure of
    // returned records, and have obviously dummy values that we can show to any user.
    sample: {
      id: 1,
      createdAt: 1472069465,
      name: 'Best Spagetti Ever',
      authorId: 1,
      directions: '1. Boil Noodles\n2.Serve with sauce',
      style: 'italian'
    },

    // If the resource can have fields that are custom on a per-user basis, define a function to fetch the custom
    // field definitions. The result will be used to augment the sample.
    // outputFields: () => { return []; }
    // Alternatively, a static field definition should be provided, to specify labels for the fields
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
