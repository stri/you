(function(module){
	var packCache = require('./combine/pack'),
		fs = require('fs'),
    path = require('path'),
    https = require('https'),
    http = require('http'),
    log = require('./util/log'),
		task = require('./util/task');

	path.existsSync = fs.existsSync ? function(uri) {
	  return fs.existsSync.call(fs, uri)
	} : path.existsSync;

	var PLUGINS_PATH = path.normalize(__dirname+'/../plugins/');
	var isURL = /(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/g;

	module.exports = {
		/**
		 * 获取所有列表
		 * @return  {[type]}  [description]
		 */
		getList: function(){
			var list = [];
			['css','js'].forEach(function(type){
				for(var p in packCache[type]){
					list.push({
						name: p,
						type: type,
						author: packCache[type].author || '',
						desc: packCache[type].desc || '',
						version: packCache[type].version || ''
					});
				}
			});
			return list;
		},
		/**
		 * 安装插件
		 * @param   {[type]}    uri       [description]
		 * @param   {Function}  callback  [description]
		 * @return  {[type]}              [description]
		 */
		install: function(uri,callback){
			var name = path.basename(uri),
				_packUri = PLUGINS_PATH+''+name,
				codeStr,
				_this = this,
				createFile = function(code){
					var _pack;
					fs.writeFileSync(_packUri,code);
					_pack = require('../plugins/'+name);
					packCache.add(_pack.type || 'js',path.basename(name,'.js'),_pack);
					log.log2('install','success');
				};

			log.log2('install','start');
			// 如果是url的话，先请求
			if(isURL.test(uri)){
				log.log2('install','get',uri);
				var _http = /^https/gi.test(uri) ? https : http;
				_http.get(uri,function(res){
				  res.on('data', function(d) {
				  	createFile(d.toString());
				  });
				}).on('error',function(e){
					log.log3('install','error');
				});
				return;
			}

			if(path.existsSync(uri)){
				codeStr = fs.readFileSync(uri, 'utf-8');
				createFile(codeStr);
			}else {
				log.log3('install','error','file is exit');
			}
		}
	};
})(module);