/**
 * sever node服务环境
 * @authors Stri (stri.vip@gmail.com)
 * @date    2013-05-30 11:34:51
 * @version 0.1
 */

(function(module) {
  var express = require('express'),
    parseParam = require('./util/parseParam'),
    path = require('path'),
    cluster = require('cluster');

  module.exports = createProjectServer;

  var pid;

  process.on('SIGINT', function(err) {
    console.log('kill process pid:' + pid);
    process.kill(pid);
    process.exit(0);
  });

  /** 
   * 创建一个工程服务器
   * @param  {Object} Opts [配置参数]
   * @param  {Function} [combine] [合并方法]
   */
  function createProjectServer(Opts,combine) {
    var that = {},
      init,
      bindEvent,
      config,
      app,
      destory;
    config = getProjectParam(Opts); // 参数
    app = express();

    // 如果开启gzip则
    if (config.origin.gzip) {
      app.use(express.compress());
      app.use(express.methodOverride());
      app.use(express.bodyParser());
    }

    // 内部逻辑
    bindEvent = function() {};

    /**
     * start process
     */
    function start() {
      if (pid) {
        process.kill(pid);
      }
      app.use(app.router);
      app.use(addRequestListen);
      process.title = "You前端开发环境";
      pid = process.pid;

      if (config.root && config.port) {
        app.use(express['static'](config.root));
        app.use(express['directory'](config.root));
        app.listen(config.port);
      } else {
        console.log('server root is null.');
        process.kill(pid);
      }
    }

    /** 
     * stop process
     * @return  {[type]}  [description]
     */
    function stop() {
      app.abort();
      if (pid) {
        process.kill(pid);
        process.exit(0);
      }
    }

    /**
     * 监听express的request
     */
    function addRequestListen(req, res, next) {
      var fileType = getFileCombineType(req.url, config);

      if (fileType.status) {
        res.header("Content-type", fileType.contentType);

        var newConfig = parseParam(config);

        // 合并
        combine({
          config: newConfig, // 配置参数
          file: {
            path: path.normalize(newConfig.root + req.url.split('?')[0]), // 路径
            type: fileType.type,
            contentType: fileType.contentType
          },
          req: req,
          res: res
        });

        //  return res.end();
      } else {
        next();
      }
    }

    /**
     * 获取projectDataParam
     * @param {Object} [全局配置参数]
     */
    function getProjectParam(config) {
      return parseParam({
        root: "/",
        port: 8080,
        origin: config
      }, config);
    }

    /**
     * 获取文件类型
     * @param  {String} filePath [文件路径]
     * @param {String} [charset] [编码]，默认为utf-8
     */
    function getFileCombineType(uri, config) {
      var type,
        uri = uri.toLowerCase().split('?')[0],
        len = uri.length,
        _type,
        hash = {};

      uri = uri.split('.').reverse();
      _type = uri.length > 1 && uri[0] ? uri[0] : false;
      _type = '.' + _type;

      if (config.origin.js_file_type.split(',').indexOf(_type) != -1) {
        type = 'js';
      }

      if (config.origin.css_file_type.split(',').indexOf(_type) != -1) {
        type = 'css';
      }

      if (type) {
        var charset = config.origin[type + '_charset'] || 'UTF-8';
        charset = charset.toUpperCase();
        hash.js = "application/x-javascript;Charset=" + charset;
        hash.css = "text/css;Charset=" + charset;
      }

      return {
        status: !! type,
        type: type,
        contentType: hash[type]
      };
    }

    // destroy;
    destroy = function() {
      app.abort();
    };

    // 定义初始化
    init = function() {
      bindEvent();
    };

    // 初始化
    init();

    that.destroy = destroy;
    that.start = start;
    that.stop = stop;

    return that;
  }

})(module);