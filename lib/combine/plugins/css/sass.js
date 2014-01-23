/**
 * css合并
 * @authors Stri (stri.vip@gmail.com)
 * @date    2013-05-30 17:32:53
 * @version $Id$
 */
(function(module) {
  var fs = require('fs'),
    path = require('path'),
    util = require('../../util'),
    sass;

  var impReg = /@import\s*(url\s*\()*\s*(['|"]?)([\w\-\.\:\/\\\s\?\:\,\=\@]+)\2\s*(\))*\s*;?/igm;
  var urlReg = /url\s*\(\s*(['|"]?)([^\)|\:]+)\1\s*\)/ig;

  path.existsSync = fs.existsSync ? function(uri) {
    return fs.existsSync.call(fs, uri)
  } : path.existsSync;

  try {
    sass = require('node-sass');
  } catch (e) {}

  // 当路径是css,但找不到时，用scss后缀去查找
  function getFilePath(filePath){
    var extname = path.extname(filePath);
    if (extname == ".css" && !path.existsSync(filePath)){
      return filePath.replace(/css$/gi,'scss');
    }
    return filePath;
  }
  /** 
   * 打包方法
   * @param  {[Opts]} Opts       [配置参数]
   * @param  {[Object]} beCombined [已经打过的文件列表]
   */
  function combine(Opts, beCombineMap) {
    var filePath = Opts.file.path,
      codeStr = util.getFileCodeStr(getFilePath(filePath), Opts),
      baseDir = Opts.baseDir;

    beCombineMap[filePath] = 1; // 已经合并过了
    return codeStr.replace(impReg, function() {
      var key = arguments[3],
        uri;

      if (key) {
        if (/^http/gi.test(key)) {
          return '@import url(' + key + ');';
        }

        if (!/css|scss|sass/gi.test(path.extname(key))){
          key = key+'.scss';
        }
        
        uri = util.getAbsolutePathByKey(key, filePath);
        Opts.file.path = uri;
        return beCombineMap[uri] == 1 ? '' : combine(Opts, beCombineMap) + '\n';
      }
    });
  }

  module.exports = {
    combine: function(Opts, callback) {
      var code = combine(Opts, {});
      if (sass) {
        sass.render({
          data: code,
          success: function(css) {
            callback(css);
          },
          error: function(error) {
            var line = parseInt(error.split(':')[1]);
            line += error.split("\n").length;
            error += '\n/*(提醒：代码在第'+(line+2)+'行附近有错误).*/\n';
            callback(error+code,true);
          }
        });
      } else {
        callback('please install node-sass:');
      }
    }
  };
})(module);