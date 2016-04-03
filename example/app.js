var loadtest = require('../src')();
var path     = require('path');
var base     = path.normalize(process.cwd());
var utils    = require('yocto-utils');

console.log(' *** should load test and folder is : ', path.normalize(process.cwd() +
'/example/config'));

loadtest.initialize(path.normalize(process.cwd() + '/example/config')).then(function (value) {
  console.log('\n succes initialize : ');

  loadtest.start().then(function (value) {
    console.log('\n succes start : ', utils.obj.inspect(value));
  }).catch(function (error) {
    console.log('Error start : ', error);
  });
}).catch(function (error) {
  console.log('Error initialize : ', error);
});
