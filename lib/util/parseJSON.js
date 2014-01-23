/**
 * pasrJSON 过滤JSON文件的注释
 * @authors Stri (stri.vip@gmail.com)
 * @date    2013-05-30 10:33:02
 * @version 0.1
 */
(function(module){
  // import
  // 
  var uglify = require('uglify-js');

  function parseJSON(str){
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
    
    return JSON.parse(astStr);
  }


  // exports
  module.exports = parseJSON;
})(module);

