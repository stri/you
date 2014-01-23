/**
 * combine 合并CSS和JS
 * @authors Stri (stri.vip@gmail.com)
 * @date    2013-05-30 14:30:00
 * @version $Id$
 */
(function(module) {
  var parseParam = require('../util/parseParam'),
    fs = require('fs'),
    util = require('./util'),
    path = require('path'),
    pack = require('./pack'),
    cleanjs = require('./cleanjs');

  // cache
  var fileCache = {};
  var cleanjsObjs = {};
  var fileCodeCache = {};

  /**
   * 合并
   * @param {Object} [Opts] [配置参数]
   */
  function combine(Opts, callback) {

    var filePath = path.normalize(Opts.file.path),
      root = path.normalize(Opts.config.root),
      fileType = Opts.file.type,
      conf = Opts.config,
      codeStr,
      originConf = conf.origin || conf,
      packStyle = fileType == 'js' ? originConf.js_package_depend_style : originConf.css_package_depend_style,
      cache = fileType == 'js' ? originConf.js_cache : originConf.css_cache,
      baseDir = path.normalize(filePath.split('/' + fileType + '/')[0]);

    // 设置JS或CSS的根目录
    Opts.baseDir = baseDir + '/' + fileType + '/';

    // 是否压缩
    Opts.isMini = originConf[fileType + '_compress'] === true;

    // 是否缓存
    Opts.cache = cache === true;

    // 是否给CSS里的图片添加版本号
    Opts.addImageVersion = originConf['css_image_version'] === true;

    // 压缩后的注释
    Opts.commentText = originConf[fileType + '_comment_text'] === true;

    // CSS默认
    if (fileType == 'css' && (!packStyle)) {
      packStyle = 'default';
    }

    // JS默认
    if (fileType == 'js' && (!packStyle)) {
      packStyle = 'default';
    }

    // 如果不支持，就报错
    if (!pack[fileType][packStyle]) {
      callback && callback(null, "found out pack combine device about " + packStyle)
      return;
    }

    // 如果强制无缓存
    if (Opts.req && Opts.req.query && Opts.req.query.cache == 0) {
      Opts.cache = false;
    }

    // 如果没有Opts.req，则不进行缓存
    if (!Opts.req) {
      Opts.cache = false;
    }

    /**
     * 设置可用扩展名
     */
    util.setExtname(originConf.js_file_type.split(',').concat(originConf.css_file_type.split(',')));
    Opts.filePathUri = filePath;

    // cleanjs插件
    if (fileType == "js" && originConf.unique_js === true) {
      var cleanjsObj = cleanjsObjs[Opts.baseDir] || (cleanjsObjs[Opts.baseDir] = cleanjs({
        jsRoot: Opts.baseDir,
        options: originConf.unique_js_options
      })),
        rootPath = cleanjsObj.getRootPath(),
        indexKey = cleanjsObj.getIndexKey(filePath),
        parentKey = cleanjsObj.getParentPath(filePath),
        cleanjsCache = {};

      if (cleanjsObj.isRoot(parentKey)) {
        cleanjsObj.empty(parentKey);
      } else {
        cleanjsCache = cleanjsObj.getCache(cleanjsObj.getParentPath(parentKey));
      }


      Opts.beCombineMap = cleanjsCache.beCombineMap;
      Opts.fileCodeCache = cleanjsCache.fileCodeCache;

      if (!Opts.req) {
        Opts.fileCodeCache = cleanjsObj.getCache(rootPath).fileCodeCache;
      }
    }

    // 如果是压缩
    if (Opts.cache && (codeStr = fileCache[filePath])) {
      if (Opts.res) {
        Opts.res.end(codeStr);
      }
      callback && callback(codeStr);
    } else {
      Opts.util = util;
      util.setOption(Opts);

      var returnCache;

      returnCache = pack[fileType][packStyle].combine(Opts, function(code, error) {
        util.setOption(Opts);
        codeStr = code;
        if (!error) {
          codeStr = util.getSourceByCompress(code, Opts);
        }

        // 如果是压缩
        if (Opts.cache) {
          fileCache[filePath] = codeStr;
        }

        if (Opts.res) {
          Opts.res.end(callback ? (callback(codeStr) || codeStr) : codeStr);
        }

        Opts.fileCodeCache && (Opts.fileCodeCache[Opts.file.path] = codeStr);
        callback && callback(codeStr, error);
      });

      if (cleanjsObj && returnCache && typeof returnCache == 'object' && returnCache.beCombineMap && returnCache.fileCodeCache) {
        cleanjsObj.setCache(parentKey, returnCache);
      }
    }
  }

  // 包中心
  combine.pack = pack;

  module.exports = combine;
})(module);