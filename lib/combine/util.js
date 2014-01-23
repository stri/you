/**
 * 工具
 * @authors Stri (stri.vip@gmail.com)
 * @date    2013-05-30 17:38:09
 * @version $Id$
 */
(function(module) {
  var path = require('path'),
    fs = require('fs'),
    cleanCSS = require('clean-css'),
    md5 = require('../util/md5').syncMD5,
    log = require('../util/log')
    uglify = require('uglify-js');
  var cssRubReg = /\@charset([^;]*);|\/\*((.|\r|\n)*?)\*\//ig,
    extname = ['.js', '.css'],
    Opts = {};

  path.existsSync = fs.existsSync ? function(uri) {
    return fs.existsSync.call(fs, uri)
  } : path.existsSync;

  /** 
   * 压缩文件
   * @param {String} [codeStr] [源码]
   * @param {String} [fileType] [文件类型，默认为js]
   */
  function getSourceByCompress(codeStr) {
    var ast,
      fileType = Opts && Opts.file && Opts.file.type || 'js',
      compressor,
      isError,
      cssBR = '\n',
      arg = arguments,
      commentText = '';

    if (fileType == 'js') {
      try {
        ast = uglify.parse(codeStr);
      } catch (e) {
        isError = true;
        log.log3('Error', e.message + ' ' + Opts.file.path);
      }

      if (!isError) {
        // 保证输出风格美观，此处判断是否压缩
        if (Opts.isMini) {
          ast.figure_out_scope();
          ast.mangle_names();
          compressor = uglify.Compressor({
            sequences: false,
            warnings: false
          });
          ast = ast.transform(compressor);
          codeStr = ast.print_to_string() + '';
        } else {
          codeStr = ast.print_to_string({
            beautify: true,
            indent_level: 2
          });
        }
      }
    } else {
      commentText = formatCommentText(Opts.commentText, fileType);

      // 如果压缩
      if (Opts.isMini) {
        cssBR = '';
        codeStr = cleanCSS.process(codeStr, {
          processImport: false
        });
      }

      codeStr = codeStr.replace(cssRubReg, '');
      codeStr = '@charset "' + (Opts.config.css_charset || 'utf-8') + '"\;' + cssBR + codeStr;

      // 如果要设置版本
      if (codeStr && Opts.addImageVersion) {
        return commentText + setCSSImageVersion(codeStr, Opts);
      }
    }

    return commentText + codeStr;
  }


  /** 
   * 根据路径，获取文件内容
   * @param  {[type]} filePath [路径]
   * @param {Object} [Opts] [是否压缩]
   */

  function getFileCodeStr(filePath,Opts) {
    var codeStr = '';

    if (path.existsSync(filePath)) {
      codeStr = fs.readFileSync(filePath, 'utf-8');
      if (Opts.file.type == 'js') {
        codeStr = getSourceByCompress(codeStr, Opts);
      } else {
        codeStr = replaceImgPathToRelativePath(codeStr, filePath)
      }
    } else {
      throw new Error('found out abort file: ' + filePath);
    }

    return codeStr;
  }

  /** 
   * 根据key获取其绝对路径
   * @param  {[string]} key      [description]
   * @param  {string} filePath 文件路径
   */

  function getAbsolutePathByKey(key, filePath, notExtName) {
    var currentPath = filePath.split('/'),
      basePath,
      len = currentPath.length;
    currentPath.length = len - 1;
    basePath = currentPath.join('/');

    if (extname.indexOf(path.extname(key)) != -1) {
      return path.normalize(basePath + '/' + key);
    } else if (notExtName) {
      return path.normalize(basePath + '/' + key);
    } else {
      return path.normalize(basePath + '/' + key + '.js');
    }

    // return path.normalize(basePath + '/' + baseKey + '.' + fileType);
  }

  /** 
   * 根据key获取其相对路径
   * @param  {[string]} key      [description]
   */
  function getRelativePathByKey(key, filePath, baseDir) {
    var aPath = getAbsolutePathByKey(key, filePath);
    return aPath.replace(baseDir, '');
  }

  /**
   * 获取引用的内容值
   * @param  {[type]} key [description]
   */
  function getImportValue(key) {
    return key.split('\"')[1] || key.split('\'')[1] || key.split('\(')[1] && key.split('\(')[1].split('\)')[0] || key;
  }

  /**
   * [replaceImgPathToRelativePath description]
   *
   * @method replaceImgPathToRelativePath
   *
   * @return {[type]}
   */
  function replaceImgPathToRelativePath(source, filePath) {
    var urlReg = /url\s*\(\s*(['|"]?)([^\)|\:]+)\1\s*\)/ig,
      arrImageUrl = source.match(urlReg) || [],
      arr = getAviablePath(arrImageUrl),
      _replaceImgHash = {};

    source = source.replace(cssRubReg, '');

    // return source;
    if (arr.length) {
      arr.forEach(function(uri) {
        var imgPath = getImportValue(uri);
        _replaceImgHash[imgPath] = getRelativeByImgPath(getAbsolutePathByKey(imgPath, filePath, true), imgPath)
      });

      Object.keys(_replaceImgHash).forEach(function(key) {
        var reg = new RegExp(key.replace(/(\"|\'|\(|\)|\.|\/|\?|\=)/gi, function(a, b, c) {
          return '\\' + a;
        }), 'ig');

        //   console.log(reg,_replaceImgHash[key]);
        source = source.replace(reg, _replaceImgHash[key]);
      });
    }
    return source;
  }

  /** 
   * 设置CSS里的图片版本号
   * @param {String} [source] [代码]
   * @param {Object} [Opts] [配置参数]
   */
  function setCSSImageVersion(source) {
    var urlReg = /url\s*\(\s*(['|"]?)([^\)|\:]+)\1\s*\)/ig,
      arrImageUrl = source.match(urlReg);

    var versionHash = getFileVersionHask(getAviablePath(arrImageUrl), Opts);

    // 过滤图片版本号
    var _arr = Object.keys(versionHash);

    var setVersion = function(source) {
      var uri = _arr.shift();
      if (uri) {
        var reg = new RegExp(uri.replace(/(\"|\'|\(|\)|\.|\?|\=)/gi, function(a) {
          return '\\' + a;
        }), 'ig');
        return setVersion(source = source.replace(reg, versionHash[uri].newUri));
      } else {
        return source;
      }
    }

    return setVersion(source);
  }

  /**
   * 根据图片地址获取其相对路径
   */
  function getRelativeByImgPath(importedPath, imgPath) {
    return path.relative(Opts.filePathUri, importedPath).replace('../', '');
  }

  function getAviablePath(arrImageUrl) {
    var arr = [];
    arrImageUrl && arrImageUrl.forEach(function(uri) {
      var _uri = uri.split('(')[1].split(')')[0].replace(/(\"|\')/gi, '');
      _uri = (_uri.split('?')[0] || '').split('#')[0];
      if (/(png|jpg|gif|eot|svg|ttf|woff)$/gi.test(_uri)) {
        arr.push(uri);
      }
    });
    return arr;
  }

  /** 
   * 根据文件获取MD5值
   * @param {Array} [fileArr] [url(xxx)的数组]
   * @param {Object} [Opts] 配置参数
   */
  function getFileVersionHask(fileArr) {
    var filePathArr,
      iPath,
      fileArr = fileArr || [],
      filePathHash = {};
    // 得到文件的绝对路径
    filePathArr = fileArr.map(function(uri) {
      var _uri;
      filePathHash[uri] = {};
      filePathHash[uri].uri = (_uri = (getImportValue(uri).split('?')[0] || '').split('#')[0]);
      filePathHash[uri].data = ((getImportValue(uri).split('?')[1] || '').split('#')[0]);
      filePathHash[uri].hash = (getImportValue(uri).split('#')[1]);
      return filePathHash[uri].origin = path.resolve(Opts.filePathUri, '..', _uri);
    });

    // 根据版本号并设置
    var _arrPath = Object.keys(filePathHash);

    while (_arrPath.length) {
      var uri = _arrPath.shift(),
        md5Key = md5(filePathHash[uri].origin).substr(0, 16),
        _uri = filePathHash[uri].uri,
        _data = filePathHash[uri].data || '',
        _hash = filePathHash[uri].hash;
      var str = '';
      filePathHash[uri].md5 = md5Key;
      str = _uri + '?v=' + md5Key + (_data ? '&' + _data : '');
      str += _hash ? '#' + _hash : '';
      filePathHash[uri].newUri = 'url(' + str + ')';
    }

    return filePathHash;
  }

  /**
   * 获取串的MD5
   */
  function getMd5Str(str) {
    return md5(str);
  }
  /** 
   * 格式文本为注释格式
   * @param {String} [text] [文本内容]
   */
  function formatCommentText(text, fileType) {
    if (!text) return '';

    if (fileType == 'js') return '';
    if (text.lastIndexOf('\n') != -1) {
      return '/**' + text.replace(/\n/gi, '\n\ * ') + '\n */\n';
    } else {
      return '// ' + text + '\n';
    }
  }

  /**
   * 设置extname
   * @param  {[type]}  name  [description]
   */
  function setExtname(name) {
    extname = extname.concat(name);
  }

  // 设置Opts
  function setOption(config) {
    Opts = config;
  }

  module.exports = {
    getAbsolutePathByKey: getAbsolutePathByKey,
    getRelativePathByKey: getRelativePathByKey,
    getFileCodeStr: getFileCodeStr,
    getImportValue: getImportValue,
    getSourceByCompress: getSourceByCompress,
    setCSSImageVersion: setCSSImageVersion,
    formatCommentText: formatCommentText,
    getMd5Str: getMd5Str,
    setOption: setOption,
    setExtname: setExtname
  };
})(module);