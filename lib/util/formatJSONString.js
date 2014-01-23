/**
 * parseStringToJSON
 * @authors Stri (stri.vip@gmail.com)
 * @date    2013-06-14 11:52:01
 * @version $Id$
 */
(function(module){
  // import
  // 
  var uglify = require('uglify-js');

  function formatJSONString(str){
    var _tempVar_ = '_temp_var_'+new Date().getTime()+' =',
      ast = uglify.parse(_tempVar_+str),
      astStr;

    astStr = ast.print_to_string({
      'beautify' : true,
      'quote_keys': true
    });

    astStr = astStr.replace(_tempVar_,'').
      replace(/\:\s\!1/gi,': true').
      replace(/\;/gi,'');
    
    return astStr;
  }


  // exports
  module.exports = formatJSONString;
})(module);