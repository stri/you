/**
 *  you 主js
 * @authors Stri (stri.vip@gmail.com)
 */
var conf = require('./config');
var server = require('./server');
var task = require('./util/task@1.0');
var plugin = require('./plugin');
var json = require('./util/json-file');
var combine = require('./combine/index');
var httpd;

var you = {};

// 启动服务
you.start = function() {
	var server = this.getServerObject(),
		configObj = this.getConfigObject(),
		combine = this.getCombineObject();
	configObj.getConfig(function(config) {
		httpd = httpd ? httpd : server(config,combine);
		httpd.start();
	});
};

// 停止服务
you.stop = function() {
	return httpd && httpd.stop();
};

// 获取信息
you.getInfo = function() {
	var info = json.read('./package.json').data;
	return info;
};

// 获取版本号
you.getVersion = function() {
	var info = this.getInfo();
	return info.version;
};

// 打包压缩
you.compress = function(from, to,username, password,force) {
	var _this = this,
		configObj = this.getConfigObject();
	configObj.getConfig(function(config) {
		var task = _this.getTaskObject(),
			combine = _this.getCombineObject();

		if (/^http/gi.test(from)) {

			if (force) {
				config.remove_error_file = true;
			}

			task.svnExport(from, username, password, to, {
				config: config,
				onComplete: function() {
					task.compress(null, to, config,combine);
				}
			});
		}
	});
};

// 安装配置信息
you.installConfig = function(uri,callback){
	var conf = this.getConfigObject();
	conf.installConfig(uri,callback);
};

//===========以下是用于核心对象==========/
//
// 配置对象
you.getConfigObject = function(){
	return conf;
};

// 任务对象，打包合并生成文件
you.getTaskObject = function(){
	return task;
};

// Http服务对象
you.getServerObject = function(){
	return server;
};

// 合并对象(是一个函数)
you.getCombineObject = function(){
	return combine;
};

// 插件对象
you.getPluginObject = function(){
	return plugin;
};


// 扩展
you.extend = function(callback){
	you = callback(you);
};

// 安装插件
plugin.extend(function(fn){
	if (typeof fn == 'function'){
		you.extend(fn);
	}
});

module.exports = you;