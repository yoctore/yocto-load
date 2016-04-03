'use strict';

var _         = require('lodash');
var logger    = require('yocto-logger');
var joi       = require('joi');
var path      = require('path');
var Q         = require('q');
var async     = require('async');
var loadtest  = require('loadtest');
var request   = require('request');

/**
* Yocto Load : test your REST API
*
* Wrapper of module : lodatest
*
* For more details on these dependencies read links below :
* - LodAsh : https://lodash.com/
*
* @date : 2016/04/01
* @author : Cedric Balard <cedric@yocto.re>
* @copyright : Yocto SAS, All right reserved
* @class YoctoLoad
*/
function YoctoLoad (yLogger) {

  /**
   * Default logger
   */
  this.logger = yLogger || logger;

  /**
   * Base url of api
   */
  this.apiUrl = '';

  /**
   * Will contains the Yocto-config instance
   */
  this.config = {};

  /**
   * Will contains the jwt token if it's enabled
   */
  this.jwtToken = null;

  /**
   * Array that contains all result of each test
   */
  this.reports = [];
}

/**
 * Load an external file to construct response just by specifing error code
 *
 * @param  {String} pathFile the path of the config folder
 * @return {boolean} true if file is loaded, otherwise false
 */
YoctoLoad.prototype.initialize = function (pathFile) {
  // create a promise deferred
  var deferred = Q.defer();

  // create instance of yocto-config
  this.config  = require('yocto-config')(this.logger);

  // config of the loadtest
  var main = joi.object().required().keys({
    // port used by loadtest
    port  : joi.number().integer().required().min(0),
    // define if all methods routes test was called syncrhonously or not
    async : joi.boolean().required()
  });

  // config of the api to test
  var api = joi.object().required().keys({
    port      : joi.number().integer().optional().allow(null).min(0).default(null),
    protocol  : joi.string().required().empty().valid(['http', 'https']),
    host      : joi.string().required().empty()
  });

  // optional jwt
  var jwt = joi.object().optional().keys({
    enable       : joi.boolean().required(),
    key          : joi.string().required().empty(),
    // path to retrieve url
    path         : joi.string().required().empty(),
    refreshDelay : joi.number().integer().optional().min(0).default(30000)
  }).default({
    enable       : false,
    key          : null,
    path         : null,
    refreshDelay : null
  });

  // all routes to tests
  var routes = joi.array().required().min(1).items(
    joi.object().required().keys({
      enable            : joi.boolean().required(),
      method            : joi.string().required().empty().valid(['get', 'post', 'patch']),
      path              : joi.string().required().empty(),
      timeout           : joi.number().integer().min(0).optional().default(3000),
      headers           : joi.object().unknown().optional().default({}),
      body              : joi.object().unknown().optional().default({}),
      maxRequests       : joi.number().integer().required().min(1),
      maxSeconds        : joi.number().integer().required().min(1),
      concurency        : joi.number().integer().required().min(1),
      requestsPerSecond : joi.number().integer().required().min(1),
      cookies           : joi.array().optional().default([]),
      contentType       : joi.string().optional().empty().default('text/plain')
    })
  );

  // add config all schemas in config
  this.config.addCustomSchema('main', main, true, true);
  this.config.addCustomSchema('api', api, true, true);
  this.config.addCustomSchema('jwt', jwt, true, true);
  this.config.addCustomSchema('routes', routes, true, true);

  // set config path
  this.config.setConfigPath(path.normalize(pathFile));

  // load config
  this.config.load().then(function (value) {
    // set url of api
    this.apiUrl = value.api.protocol + '://' + value.api.host + (_.isNull(value.api.port) ? '' :
    (':' + value.api.port));

    // check if jwt is enable to start process
    if (value.jwt.enable) {
      this.jwtProcess();
    }

    // config is load so resolve value
    deferred.resolve(value);
  }.bind(this)).catch(function (error) {
    // reject error
    deferred.reject(error);
  });

  // return result of this methods
  return deferred.promise;
};

/**
 * Start process that send all request to make stress test
 *
 * @return {boolean} true if file is loaded, otherwise false
 */
YoctoLoad.prototype.start = function () {
  // create a promise deferred
  var deferred = Q.defer();

  // read each routes defined in config
  async[this.config.config.main.async ? 'each' : 'eachSeries'](this.config.config.routes,
  function (item, nextRoute) {

    // check if item is enable
    if (!item.enable) {
      this.logger.info('[ YoctoLoad.start ] -loadtests is disable for route : ' + item.path);
      return nextRoute;
    }

    // object that will be sent to client
    var options = _.merge({
      url : this.apiUrl + item.path
    }, _.omit(item, [ 'enable', 'path' ]));

    // TODO : set jwt process
    if (!_.isNull(this.jwtToken)) {
      this.logger.debug('[ YoctoLoad.start ] - x-jwt token was set into header for routes',
      item.path);

      // Set jwt header
      options.headers = _.merge(options.headers, {
        'x-jwt-access-token' : this.jwtToken
      });
    }

    var date = new Date();

    // object that will added on reports lists
    var report = {
      request : _.merge(options, {
        startAt  : date.toISOString()
      })
    };

    this.logger.info('[ YoctoLoad.start.loadtest ] - process start for path : ' + item.path +
    ' [' + item.method + ']');

    // Use load test to start load test
    loadtest.loadTest(options, function (error, result) {
      // retrieve date instance
      var date = new Date();

      // add the response to reports
      report.response = _.merge({
        endAt : date.toISOString()
      }, error ? error : result);
      this.reports.push(report);

      // check if an error occured
      if (error) {
        // break the async process to show the error
        this.logger.error('[ YoctoLoad.start.loadtest ] - an error occured : ' + error);
        return nextRoute(error);
      }

      this.logger.info('[ YoctoLoad.start.loadtest ] - process succes for path : ' + item.path +
      ' , result is :' +
      '\n  --> Total Requests       : ' + result.totalRequests +
      '\n  --> Total Errors         : ' + result.totalErrors +
      '\n  --> Requests per seconds : ' + result.rps +
      '\n  --> Duration test (s)    : ' + result.totalTimeSeconds +
      '\n  --> Min latency (ms)     : ' + result.minLatencyMs +
      '\n  --> Max latency (ms)     : ' + result.maxLatencyMs +
      '\n  --> Mean latency (ms)    : ' + result.meanLatencyMs
      );

      // call next route
      nextRoute();
    }.bind(this));
  }.bind(this), function done (error) {
    // check if an error occured
    if (error) {
      // reject the error occured
      this.logger.error('[ YoctoLoad.start.done ] - an error occured into process : ' + error);
      return deferred.reject(error);
    }

    // check if jwt interval is enabled
    if (!_.isUndefined(this.refreshTokenInterval)) {
      // clear the interval
      clearInterval(this.refreshTokenInterval);
    }
    // no error occured so resolve reports
    deferred.resolve(this.reports);
  }.bind(this));

  // return result of this methods
  return deferred.promise;
};

/**
 * Method that initialize an interval to retrieve jwt token
 */
YoctoLoad.prototype.jwtProcess = function () {
// create url to retrieve jwt
  var tokenRefreshUrl = this.apiUrl + this.config.config.jwt.path;

  /**
   * Default method to refresh token value
   */
  var refreshToken = function () {
    // get current toekn
    request.get(tokenRefreshUrl,
    function (error, response, body) {
      // has error ?
      if (!error && response.statusCode === 200) {
        // set jwt token
        this.jwtToken = body;
        // log message
        this.logger.info('[ YoctoLoad.jwtProcess.refresh ] - refresh token succeed.');
        // debug message
        this.logger.debug([ '[ YoctoLoad.jwtProcess.refresh ] - token from is :',
        body ].join(''));

      } else {
        // forbidden state
        if (!_.isUndefined(response) && response.statusCode === 403) {
          // log error message
          this.logger.error([ '[ YoctoLoad.jwtProcess ] -',
                              'Not allowed to access jwt ressource', error ].join(' '));
        }

        // log error message
        this.logger.error([ '[ YoctoLoad.jwtProcess ] - Cannot set jwt token', error ].
        join(' '));
      }
    }.bind(this));
  }.bind(this);

  // define interval of refresh
  this.refreshTokenInterval = setInterval(refreshToken, this.config.config.jwt.refreshDelay);
  // init current token
  refreshToken();
};

// Default export
module.exports = function (l) {
  // is a valid logger ?
  if (_.isUndefined(l) || _.isNull(l)) {
    logger.warning('[ YoctoLoad.constructor ] - Invalid logger given. Use internal logger');
    // assign
    l = logger;
  }
  // default statement
  return new (YoctoLoad)(l);
};
