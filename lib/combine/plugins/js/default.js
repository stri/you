/**
 * 默认
 * @authors Stri (stri.vip@gmail.com)
 * @date    2013-05-30 18:20:43
 * @version $Id$
 */
(function(module){
  var fs = require('fs'),
    path = require('path'),
    util = require('../../util');

  /** 
   * 打包方法
   * @param  {[Object]} fileMap    [要打包的文件列表]，可以为空
   * @param  {[Opts]} Opts       [配置参数]
   * @param  {[Object]} beCombined [已经打过的文件列表]
   */
  function combine(Opts){
    var filePath = path.normalize(Opts.file.path), 
      codeStr = util.getFileCodeStr(filePath,Opts);
    return codeStr;
  }

  module.exports = {
    combine: function(Opts,callback){
      var code = combine(Opts);
      callback(code);
    }
  };
})(module);