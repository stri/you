/**
 * driWalk
 * @authors bangbang (bangbang@staff.sina.com.cn)
 * @date    2013-10-02 08:15:16
 * @version $Id$
 */
(function() {
	var path = require('path'),
		fs = require('fs');

	function walk(uri, filter, files,fileType) {
		var stat = fs.lstatSync(uri);
		fileType = fileType || {};
		fileType.js = fileType.js || ['.js'];
		fileType.css = fileType.css || ['.css'];

		if (filter(uri)) {
			if (stat.isFile()) {
				//转换成绝对路径
				uri = path.resolve(uri);

				if(fileType.css.indexOf(path.extname(uri)) != -1){
					files.css.push(uri);
				}else if (fileType.js.indexOf(path.extname(uri)) != -1){
					files.js.push(uri);
				}else {
					files.other.push(uri);
				}
			}
			if (stat.isDirectory()) {
				fs.readdirSync(uri).forEach(function(part) {
					walk(path.join(uri, part), filter, files,fileType);
				});
			}
		}
		stat = null;
	}

	//排除basename以.或者_开头的目录|文件(如.svn,_html,_psd, _a.psd等)

	function defaultFilter(uri) {
		var start = path.basename(uri).charAt(0);
		if ((start === '.' || start === '_') && path.extname(uri) !== '.js') {
			start = null;
			return false;
		}
		return true;
	}

	/**
	 * 递归遍历目录文件,获取所有文件路径;并且分成 "js|css|other" 三组.
	 * @param{String}rootDir
	 * @param{Function}filter:过滤函数,返回false就排除目录|文件
	 * @return{Object}
	 * */
	module.exports = function(rootDir, filter,fileType) {
		filter = filter || defaultFilter;

		var files = {
			css: [],
			js: [],
			other: []
		};

		walk(rootDir, filter, files,fileType);

		return files;
	};
})();