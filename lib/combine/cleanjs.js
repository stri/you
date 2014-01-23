(function(module) {
	var path = require('path'),
		parseParam = require('../util/parseParam');

	/**
	 * [cleanjs description]
	 * @method cleanjs
	 * @param  {Object} Opts [description]
	 * @param  {String} [jsRoot] [description]
	 * @param  {String} [filePath] [description]
	 * @param  {Array} [options] ['/page/path/',0]
	 */
	var cleanjs = function(Opts) {
		var that = {},
			conf,
			init,
			bindEvent;

		conf = parseParam({
			jsRoot: '',
			options: ['/page/', 0]
		}, Opts);

		// cache
		var cache = {};
		cache.beCombineMap = {};
		cache.fileCodeCache = {};
		cache.cleanjsCache = {};

		var _cache = {};

		// 判断pathA,是否在pathB中
		function inPath(a, b) {
			a = path.normalize(a);
			b = path.normalize(b);
			return b.split(a).length > 1;
		}

		// 获取根
		function getRootPath() {
			return path.normalize(conf.jsRoot + conf.options[0]);
		}

		// 获取父级
		function getParentPath(filePath) {
			return path.join(filePath, '../');
		}

		// 获取主索引
		function getIndexKey(filePath) {
			var root = that.getRootPath(),
				parentRoot;

			if (that.inPath(filePath, root)) {
				parentRoot = that.getParentPath(filePath);
				if (root == parentRoot) {
					return conf.options[1] == 0 ? filePath : root;
				} else {
					return that.getIndexKey(parentRoot);
				}
			}

			return filePath;
		}

		// 判断是否为root
		function isRoot(parentRoot){
			var root = that.getRootPath();

			if (conf.options[1] == 1){
				return parentRoot == root;
			}else {
				return path.join(parentRoot,'../') == root;
			}
		}

		// 清空
		function empty(key){
			for (var p in _cache) {
				if (that.inPath(key,p)){
					_cache[p] = null;
				}
			}
		}

		// 设置缓存
		function setCache(key, cache) {
			_cache[key] = {
				beCombineMap: cache.beCombineMap || {},
				fileCodeCache: cache.fileCodeCache || {}
			};
		}

		// 获取缓存
		function getCache(key,force) {
			var a = key, b,
				arr = [],
				re = {
					beCombineMap: {},
					fileCodeCache: {}
				};

			for (b in _cache) {
				if (that.inPath(b, a)) {
					arr.push(_cache[b]);
				}
			}

			arr.forEach(function(value) {
				if (value) {
					for (var key in value.beCombineMap) {
						re.beCombineMap[key] = value.beCombineMap[key];
					}
					if (!force){
						for (var key in value.fileCodeCache) {
							re.fileCodeCache[key] = value.fileCodeCache[key];
						}
					}
				}
			});

			return re;
		}

		// api
		that.getRootPath = getRootPath;
		that.getParentPath = getParentPath;
		that.getIndexKey = getIndexKey;
		that.inPath = inPath;
		that.empty = empty;
		that.isRoot = isRoot;
		that.getCache = getCache;
		that.setCache = setCache;

		return that;
	};

	module.exports = cleanjs;
})(module);