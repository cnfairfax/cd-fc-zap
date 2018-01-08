var parseXML = require('xml2js-es6-promise');

module.exports = {
  key: 'form_capture',
  // You'll want to provide some helpful display labels and descriptions
  // for users. Zapier will put them into the UX.
  noun: 'Form Capture',
  list: {
    display: {
      label: 'Form Capture Records',
      description: 'Finds all Form Capture Records'
    },
    operation: {
      perform: (z, bundle) => {
        return z
          .request({
            url: 'https://{{bundle.authData.subdomain}}.clickdimensions.com/Service.svc/v1/account/' + bundle.authData.account_key + '/captures',
            method: 'GET'
          }).then((response) => {
            z.console.log(response.content);
            response.throwForStatus();
            return parseXML(response.content).then(function(js) {
              var i = 1;
              // CD API doesn't provide ID attribute w/ form capture objects, so, fudge it. You'll never use this attribute, but Zapier won't load the data w/out it.
              js.FormCaptures.FormCapture.forEach(function(capture) {
                capture['id'] = i;
                i++;
              });
              return js.FormCaptures.FormCapture
            });
          });
      }
    }
    
  },
  sample: {
    id: '1',
    AccountKey: '-snip-account-key-',
    CampaignCode: '',
    CreatedOn: '2015-04-30T19:10:02.852026Z',
    CrmRecordKey: '-snip-guid-',
    CrmRecordType: 'cdi_formcapture',
    ErrorLocation: 'http://tomatogardens.org/2013/error.html',
    Key: '-snip-item-key-',
    Location: 'http://analytics.clickdimensions.com/forms/h/a0aXrU6pR80mNRhR8klFi4',
    Name: 'Form Capture Email Format Test',
    Partition: '-snip-partition-key-',
    ProfileKey: '',
    SuccessLocation: 'http://tomatogardens.org/2013/success.html',
    SynchedOn: '2015-04-30T19:10:02.852026Z',
    UpdatedOn: '2015-04-30T19:10:02.852026Z',
    VisitorEntity: 'lead'
  },
  outputFields: [
    {key: 'AccountKey', label: 'Account Key'},
    {key: 'CampaignCode', label: 'Campaign Code'},
    {key: 'CrmRecordKey', label: 'Crm Record Key'},
    {key: 'CrmRecordType', label: 'Crm Record Type'},
    {key: 'ErrorLocation', label: 'Error Location'},
    {key: 'Key', label: 'Key'},
    {key: 'Location', label: 'Location'},
    {key: 'Name', label: 'Name'},
    {key: 'Partition', label: 'Partition'},
    {key: 'ProfileKey', label: 'ProfileKey'},
    {key: 'SuccessLocation', label: 'Success Location'},
    {key: 'SynchedOn', label: 'Synched On'},
    {key: 'UpdatedOn', label: 'UpdatedOn'},
    {key: 'VisitorEntity', label: 'Visitor Entity'}
  ]
}