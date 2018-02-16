const should = require('should');

const zapier = require('zapier-platform-core');

const App = require('../index');
const appTester = zapier.createAppTester(App);

describe('ClickDimensions', () => {

  it('should create a posted form', (done) => {
    const bundle = {};

    appTester(App.creates.posted_form.operation.perform, bundle)
      .then(results => {
        should(results.length).above(1);

        const firstResult = results[0];
        console.log('test result: ', firstResult)
        should(firstResult.name).eql('name 1');
        should(firstResult.directions).eql('directions 1');

        done();
      })
      .catch(done);
  });

});