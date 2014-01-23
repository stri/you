/**
 * pack.js
 * @authors Stri (stri.vip@gmail.com)
 * @date    2013-06-17 14:58:19
 * @version $Id$
 */
(function(module) {
  var fs = require('fs');
  var path = require('path');
  var pack = {
    "css": {
      "default": require('./plugins/css/import'),
      'less': require('./plugins/css/less'),
      'sass': require('./plugins/css/sass')
    },
    "js": {
      "default": require('./plugins/js/default'),
      "import": require('./plugins/js/STK'),
      "projs": require('./plugins/js/Pro@1.0')
    },
    add: function(type, name, app) {
      pack[type][name] = app;
    },
    remove: function(type,name){
      pack[type][name] = null;
    }
  };

  fs.readdirSync(path.normalize(__dirname+'/../../plugins/')).forEach(function(uri){
    var extname = path.extname(uri);
    if(extname != '.js') return;
    var name = path.basename(uri,'.js'),
      _uri = '../../plugins/'+name,
      _pack = require(_uri);
    pack[_pack.type || 'js'][name] = _pack;
  });

  module.exports = pack;
})(module);