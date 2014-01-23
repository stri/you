/**
 * $import 引用的，如STK框架
 * @authors Stri (stri.vip@gmail.com)
 * @date    2013-05-30 18:20:43
 * @version $Id$
 */
(function(module){
  var fs = require('fs'),
    path = require('path'),
    util = require('../../util');

  var reg = /\$Import\s*\(\s*(['|"])([\w\-\.\/]*)\1\s*\)\s*;?/gi;
  /** 
   * 打包方法
   * @param  {[Opts]} Opts       [配置参数]
   * @param  {[Object]} beCombined [已经打过的文件列表]
   */
  function combine(Opts,beCombineMap){
    var filePath = path.normalize(Opts.file.path), 
      codeStr = util.getFileCodeStr(filePath,Opts), 
      baseDir = Opts.baseDir;

    beCombineMap[filePath] = 1; // 已经合并过了

    return codeStr.replace(reg,function(){
      var key = arguments[2];
      if (key) {
        var uri = getAbsolutePathByKey(key,Opts);
        Opts.file.path = uri;
        return beCombineMap[uri] == 1 ? '' : combine(Opts,beCombineMap);
      }
    });
  }

  /**
   * 获取import的path
   * @param {String} [key] [引用的包名]
   */
  function getImportPath(key){
    var key = util.getImportValue(key);
    return key.replace(/\./gi,'\/');
  }

  /** 
   * 获取路径
   */
  function getAbsolutePathByKey(key,Opts){
    return path.normalize(Opts.baseDir+'/'+getImportPath(key)+'.js');
  }

  module.exports = {
    combine: function(Opts,callback){
      var code = combine(Opts,{});
      callback(code);
    }
  };
})(module);