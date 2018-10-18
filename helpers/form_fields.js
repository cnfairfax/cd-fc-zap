const parseXML = require('xml2js-es6-promise');
const Promise = require('bluebird');
const To = require('./To.js');

module.exports = async (z, bundle) => {
  // fetch form capture fields associated with the form capture record
  try {
    var [ getErr, response ] = await To(z.request({
      url: 'https://' + bundle.authData.subdomain + '.clickdimensions.com/Service.svc/v1/account/' + bundle.authData.account_key + '/captures/' + bundle.inputData.form_capture_id + '/fields',
      method: 'GET'
    }));
    if(getErr) throw new Error(getErr)
    // throw error if status > 300
    response.throwForStatus();
        
    // Parse XML
    var [parseErr, js] = await To(parseXML(response.content));
    if(parseErr) throw new Error(parseErr);
  
    // check if the FormCaptureField attribute is an array, if so, carry on
    if(Array.isArray(js.FormCaptureFields.FormCaptureField)) {
      var Fields = js.FormCaptureFields.FormCaptureField;
  
      // map fields to an array of promises
      var requests = Fields.map( field => {
        return z.request({
          url: 'https://' + bundle.authData.subdomain + '.clickdimensions.com/Service.svc/v1/account/' + bundle.authData.account_key + '/formfields/' + field.FormFieldKey,
          method: 'GET'
        });
      });
          
      // catch all FormField requests in promise.all and wait for all of them to complete, then process the array of values returned
      var [ fieldsGetError, values ] = await To(Promise.all(requests));
      if(fieldsGetError) throw new Error(fieldsGetError)
      
      // create allFields, this is the array of fields that will be returned to Zapier
      try {
        var allFields = await values.map( async (response, index) => {
  
          var [ fieldParseErr, hydratedField ] = await To(parseXML(response.content));
          if(fieldParseErr) throw new Error(fieldParseErr)
    
          if(response.status < 300) {
            return {
              key: hydratedField.FormField.FormFieldId[0],
              label: Fields[index].FormFieldLabel[0],
              required: Fields[index].Required[0]
            }
          }
    
          return {
            key: index,
            label: 'There was an error collecting this field: ' + hydroField.Error.Message + '. Refresh fields to try again.',
            required: Fields[index].Required[0]
          }
        });
      }
      catch (err) {
        throw new Error(err);
      }
    } else {
      // if the result is not an array, build custom field 
      // notifying customer of error and return that field
      var field = [{
        key: '1',
        label: 'There was a problem fetching your form fields: There are no Form Capture Fields associated with this Form Capture. Please associate Form Capture Fields to this Form Capture in your CRM and then try again.' 
      }];
      return field
    }
  }
  catch (err) {
    throw new Error(err);
  }
}