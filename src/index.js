'use strict';

var _       = require('lodash');
var logger  = require('yocto-logger');

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
}

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
