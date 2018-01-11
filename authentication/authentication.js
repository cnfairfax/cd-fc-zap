const Auth = {
  type: 'custom',
  // "test" could also be a function
  test: (z, bundle) => {
    return z
      .request({
        url: 'https://{{bundle.authData.subdomain}}.clickdimensions.com/Service.svc/v1/account/{{bundle.authData.account_key}}/captures?pageSize=1',
        method: 'GET'
      }).then((response) => {
          response.throwForStatus();
          return response;
    });
  },
  connectionLabel: '{{bundle.authData.account_key}}',
  fields: [
    {
      key: 'account_key',
      type: 'string',
      required: true,
      helpText: 'Found in your CRM at Settings > ClickDimensions Settings'
    },
    {
      key: 'token',
      type: 'string',
      required: true,
      helpText: 'Found in your CRM in the web resource file cdi_settings.xml'
    },
    {
      key: 'subdomain',
      required: true,
      choices: ['app', 'app-eu', 'app-au'],
      helpText: 'This is the subdomain of your Email Template builder URLs. You can find this by navigating to an Email Template record and clicking "FULLSCREEN" on the top ribbon. This will be the subdomain of the new window that opens.'
    }
  ]
};

module.exports = Auth;