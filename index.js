const posted_form = require('./creates/posted_form');
const form_capture = require('./resources/formCapture');
const auth = require('./authentication/authentication');
const includeAuth = require('./authentication/authHeader');
const hydrateFormField = require('./hydrators/form_fields.js');

// Now we can roll up all our behaviors in an App.
const App = {
  // This is just shorthand to reference the installed dependencies you have. Zapier will
  // need to know these before we can upload
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,
  
  hydrators: {
    hydrateFormField: hydrateFormField
  },

  beforeRequest: [includeAuth],

  afterResponse: [
  ],
  
  authentication: auth,

  resources: {
    [form_capture.key]: form_capture
  },

  // If you want your trigger to show up, you better include it here!
  triggers: {
  },

  // If you want your searches to show up, you better include it here!
  searches: {
  },

  // If you want your creates to show up, you better include it here!
  creates: {
    [posted_form.key]: posted_form
  }
};

// Finally, export the app.
module.exports = App;
