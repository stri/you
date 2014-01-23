(function(module) {
	var fs = require('fs'),
		path = require('path'),
		task = require('./task'),
		https = require('https'),
		http = require('http'),
		isURL = /(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/g;

	var json = require('./util/json-file');

	// 配置文件
	var config = {};
	config.normal = path.normalize(__dirname + '/../config/default.json');
	config.user = path.normalize(__dirname + '/../config/user.json');

	function extend(to, from) {
		for (var p in from) {
			if (from.hasOwnProperty(p)) {
				to[p] = from[p];
			}
		}

		return arguments.length > 2 ? extend.apply(null, [to].concat(argSlice(arguments, 2))) : to;
	}

	function argSlice(args, start, end) {
		var arr = [];

		if (arguments.length == 2) {
			end = args.length
		}

		for (var i = 0; i < args.length; i++) {
			if (i >= start && i < end) {
				arr.push(args[i]);
			}
		}
		return arr;
	}

	// 提供方法
	module.exports = {
		task: task,
		/**
		 * 获取全局配置
		 * @param {String} [name] [名称] 可选，如果没有，则为获取全部
		 */
		getConfig: function(name, callback) {
			var conf = {},
				uri,
				data = {};

			if (typeof name == 'function') {
				callback = name;
				name = false;
			}else {
				callback = callback || function(){};
			}

			conf.normal = json.read(config.normal);
			conf.user = json.read(config.user);

			extend(data, conf.normal.data, conf.user.data);

			if (uri = data.user_config_path) {
				// 如果是URL，则请求数据
				if (isURL.test(uri)) {
					var _http = /^https/gi.test(uri) ? https : http;
					console.log('正在获取远程配置:' + uri + '...');
					_http.get(uri, function(res) {
						res.on('data', function(d) {
							extend(data, JSON.parse(d.toString()));
							if (fn() === true) {
								callback(data);
							}
						});
					}).on('error', function(e) {
						console.log('get config error:' + uri);
					});
				} else {
					extend(data, json.read(uri).data || {})
				}
			}


			function fn() {
				if (name && data.hasOwnProperty(name)) {
					return callback(data[name]);
				}

				if (name && !data.hasOwnProperty(name)) {
					return task.emit('getConfig', {
						code: 2,
						msg: name + ' is found out!'
					});
				}

				return true;
			}

			if (fn() === true) {
				callback(data);
			}

			return data;
		},
		/**
		 * 设置配置
		 * @param   {[string]}  name   [description]
		 * @param   {[string]}  value  [description]
		 */
		setConfig: function(name, value, force) {
			var arr = value.toString().split('');

			if (arr[0] == '[' || value == "true" || value == "false" || parseInt(value) == value) {
				value = eval(value);
			}

			var conf = {},
				data = {};

			conf.normal = json.read(config.normal);
			conf.user = json.read(config.user);
			extend(data, conf.normal.data, conf.user.data);

			if (data.hasOwnProperty('user_config_path') && data.user_config_path) {
				console.log('注意：设置后，可能会影响' + data.user_config_path + '的配置。');
			}

			if (force || data.hasOwnProperty(name)) {
				conf.user.set(name, value).writeSync(null, '\n\t');
				task.emit('setConfig', {
					code: 1,
					data: {
						name: name,
						value: value
					}
				});
			} else {
				task.emit('setConfig', {
					code: 2,
					msg: name + ' is found out!'
				});
			}
		},
		setUserConfigPath: function(path) {
			if (path) {
				this.setConfig('user_config_path', path, true);
			}
		},
		installConfig: function(uri, callback) {
			var userData = json.read(config.user),
				_this = this;

			if (uri) {
				// 如果是URL，则请求数据
				if (isURL.test(uri)) {
					var _http = /^https/gi.test(uri) ? https : http;
					console.log('正在获取远程配置:' + uri);
					_http.get(uri, function(res) {
						res.on('data', function(d) {
							var data = JSON.parse(d.toString());
							install(data);
						});
					}).on('error', function(e) {
						console.log('get config error:' + uri);
					});
				} else {
					install(json.read(uri).data);
				}
			}

			function install(data) {
				for (var p in data) {
					if (data.hasOwnProperty(p)) {
						_this.setConfig(p, data[p], true);
					}
				}
				console.log('导入成功.');
				callback && callback();
			}
		}
	};
})(module);