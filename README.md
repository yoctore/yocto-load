[![NPM](https://nodei.co/npm/yocto-load.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/yocto-load/)

![alt text](https://david-dm.org/yoctore/yocto-load.svg "Dependencies Status")
[![Code Climate](https://codeclimate.com/github/yoctore/yocto-load/badges/gpa.svg)](https://codeclimate.com/github/yoctore/yocto-load)
[![Test Coverage](https://codeclimate.com/github/yoctore/yocto-load/badges/coverage.svg)](https://codeclimate.com/github/yoctore/yocto-load/coverage)
[![Issue Count](https://codeclimate.com/github/yoctore/yocto-load/badges/issue_count.svg)](https://codeclimate.com/github/yoctore/yocto-load)
[![Build Status](https://travis-ci.org/yoctore/yocto-load.svg?branch=master)](https://travis-ci.org/yoctore/yocto-load)

## Overview

This module is a part of yocto node modules for NodeJS.

Please see [our NPM repository](https://www.npmjs.com/~yocto) for complete list of available tools (completed day after day).

An utility module to perform loadtest on your API REST server.

This module is an wrapper of [loadtest](https://www.npmjs.com/package/loadtest)

## loadtest
The module loadtest should be install globaly in root like
```
sudo npm install -g loadtest
```
## How to use
This module use an yocto-config file structure to build test, please see [yocto-config module](https://www.npmjs.com/package/yocto-config) for more details.

This module implement JWT process, it can be enable in config file.

### Simple usage

```javascript
var logger    = require('yocto-logger');
var loadtest  = require('yocto-load')(logger);
var path     = require('path');
var base     = path.normalize(process.cwd());

// initialize by giving the path of the folder that contains all config file
loadtest.initialize(path.normalize(process.cwd() + '/example/config')).then(function (value) {

  // start tests
  loadtest.start().then(function (reports) {

    // when all test are done an array of object that contains all results of request was deferred
    console.log(reports);
  }).catch(function (error) {
    console.log('Error start : ', error);
  });
}).catch(function (error) {
  console.log('Error initialize : ', error);
});
```

### config file
An exemple of config file

```JSON
{
  "main" : {
    "port"  : 3007,
    "async" : false
  },
  "api"  : {
    "protocol"  : "http",
    "port"      : 8080,
    "host"      : "localhost"
  },
  "jwt"     : {
    "enable"        : false,
    "key"           : "azeraefkgefjehgfejhfevkgfkjegfzjfezjhfevz",
    "path"          : "/token/refresh",
    "refreshDelay"  : 30000
  },
  "routes" : [
    {
      "enable"            : true,
      "method"            : "get",
      "path"              : "/account",
      "timeout"           : 3000,
      "headers"           : {},
      "body"              : {},
      "maxRequests"       : 300,
      "maxSeconds"        : 2,
      "concurency"        : 10,
      "requestsPerSecond" : 100,
      "cookies"           : [],
      "contentType"       : "text/plain"
    }
  ]
}
```
