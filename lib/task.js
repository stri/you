/**
 * task
 * @authors Stri (stri.vip@gmail.com)
 * @date    2013-07-29 13:36:31
 * @version $Id$
 */
(function(module) {
  var events = require('events'),
    util = require('util'),
    task;

  function Task(){}

  util.inherits(Task,events.EventEmitter);

  module.exports = task ? task : task = new Task()
})(module);
