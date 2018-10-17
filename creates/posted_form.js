const getFormFields = require('../helpers/form_fields.js');
const getCaptureFields = require('../helpers/capture_data.js');
const To = require('../helpers/To.js');

module.exports = {
  key: 'posted_form',
  noun: 'Posted Form',
  display: {
    label: 'Create a Posted Form Record',
    description: 'Creates a posted form record for your Form Capture.'
  },
  operation: {
    inputFields: [
      {key: 'form_capture_id', label: 'Form Capture', dynamic: 'form_captureList.id.Name', altersDynamicFields: true},
      getCaptureFields,
      {key: 'domain', required: true, label: 'Website Domain', helpText: 'This is the Source URL of the form posted to Zapier.'},
      {key: 'cd_visitorkey', required: true, label: 'Visitor Key', helpText: 'This is the Visitor ID found in the CUVID cookie'},
      getFormFields
    ],
    perform: async (z, bundle) => {
      try {
        // Filter out non-form-field properties to build the posted data object - forEach probably isn't optimal, here, revisit this.
        var postedData = {};
        Object.keys(bundle.inputData).forEach((key) => {
            if(key != 'success_url' && key != 'error_url' && key != 'form_capture_id' && key != 'post_url' && key != 'domain') {
              postedData[key] = bundle.inputData[key];
            }
        });

        // send Zapier request to CD to post the submitted form
        // To is a helper function that takes a Promise and returns an array that is either 1 or 2 indexes.
        // On resolve, it returns an array with a null error value and a populated 2nd index [ ERROR (null), DATA ]
        // On reject, it returns an array with only an error object. The 1st index should only cast to true on error
        var [ postErr, response ] = await To(z.request({
          url: bundle.inputData.post_url,
          method: 'POST',
          form: postedData,
          redirect: 'manual',
          headers: {
            'Referer': bundle.inputData.domain
          }
        }));
        if(postErr) throw new Error(err)
        
        // CD returns a redirect response to most form submissions - check the location against the success and error urls
        // .slice(0, -1) accounts for the uncertain possibility of a trailing / in the url
        // CD does not generally provide easily parsed/useful error messages - if there is a location header, don't expect
        // a useful error message
        if(response.getHeader('location')) {
          if(response.getHeader('location') == bundle.inputData.success_url || response.getHeader('location').slice(0, -1) == bundle.inputData.success_url) {
            var successfulForm = {
              form_capture_id: bundle.inputData.form_capture_id,
              success: true,
              formfields: postedData
            };
            return successfulForm;
          } else if (response.getHeader('location') == bundle.inputData.error_url || response.getHeader('location').slice(0, -1) == bundle.inputData.error_url) {
            z.console.log('FORM CAPTURE ERROR URL: ' + response.getHeader('location'));
            throw new Error('There was an error submitting your form: Make sure all required fields are included and contain information.');
          }
        } else {
          if(response.content.indexOf('Account key and Domain are not valid') != -1) {
            var errorText = 'One or both of your Account Key and Domain are invalid. Please make sure the account key in your tracking script matching the account key found in your ClickDimensions Settings area in CRM. Also make sure you have created a domain record for the domain you are submitting this form from.';
            throw new Error('There was an error submitting your form: ' + errorText);
          } else {
            z.console.log('Something went wrong with the request to posted forms:\n' + JSON.stringify(response.content));
            throw new Error('There was an error submitting your form - HTML of Error Response:' + response.content); 
          }
        }
      }
      catch (err) {
        z.console.log(err);
        throw new Error(err);
      }
    },
    sample: {
      form_capture_id: 111111111,
      success: true,
      cd_visitorkey: 2222222,
      formfields: {
        firstName: 'Jimmy',
        lastName: 'Stewart',
        emailAddress: 'jstewart@email.com'
      }
    }
  }
};
