/**
 * task
 * @authors bangbang (bangbang@staff.sina.com.cn)
 * @date    2013-10-01 09:56:06
 * @version $Id$
 */
(function(module) {
	var path = require('path');
	var spawn = require('child_process').spawn;
	var exec = require('child_process').exec;
	var fs = require('fs');
	var path = require('path');
	var util = require('../combine/util');
	var $util = require('util');
	var dirWalk = require('./dirWalk');
	path.existsSync = fs.existsSync ? function(uri) {
		return fs.existsSync.call(fs, uri);
	} : path.existsSync;

	/**
	 * 压缩
	 * @param {String} [varname] [description]
	 * @return  {[type]}  [description]
	 */

	function compress(from, to, config, combine,isEmpty) {
		from = from ? path.normalize(from + '/') : null;
		to = path.normalize(to + '/'),
		originTo = to;

		// 如果没有目录，创建目录
		if (!path.existsSync(to)) {
			execute('mkdir', ['-p', to], {
				onComplete: function(data) {
					compress(from, to, config, combine,isEmpty);
				}
			});
			return;
		}

		// 清空目录
		if (!isEmpty && from) {
			removeFolder(to, {
				onComplete: function() {
					compress(from, to, config, combine,true);
				}
			});
			return;
		}

		var compressPath = {
			js: config.js_compress_path ? config.js_compress_path.split(',') : false,
			css: config.css_compress_path ? config.css_compress_path.split(',') : false
		};

		var fileTypes = {
			js: config.js_file_type ? config.js_file_type.split(',') : false,
			css: config.css_file_type ? config.css_file_type.split(',') : false
		};

		console.log('\n\033[01;37myou\033[0m', '\033[01;32mCompress\033[0m', '\033[22;33mStart \033[0m');

		var _compress = function(data) {
			var files = dirWalk(to, null, fileTypes),
				errorMsg = [],
				len = files.js.length + files.css.length,
				fileMap = {},
				startTime = new Date().getTime(),
				compressDir = [],
				_otherDir = [];

			//que
			var compressQue = que(),
				maxCompressCount = len,
				currentCompressCount = 0;

				function checkCompressStep(){
					currentCompressCount++;
					if (currentCompressCount == maxCompressCount) {
						compressQue.fire();
					}
				}

			// 压缩
			[{
				type: 'js',
				contentType: 'application/x-javascript;Charset=utf-8'
			}, {
				type: 'css',
				contentType: 'text/css;Charset=utf-8'
			}].forEach(function(file) {
				var arr;

				arr = files[file.type].sort(function(x, y) {
					if (x.length > y.length)
						return 1;
					if (x.length < y.length)
						return -1;
				});


				arr.forEach(function(uri) {
					var lastTime = new Date().getTime(),
						isError = false,
						_uri = uri.replace(to, '');
					if (compressPath[file.type] && !isCompressFilePath(_uri, compressPath[file.type], file.type) || isPrivateURI(uri)) {
						checkCompressStep();
						_otherDir.push(uri);
						return;
					};
					try {
						config.origin = config;
						combine({
							config: config,
							file: {
								path: uri,
								contentType: file.contentType,
								type: file.type
							}
						}, function(code, error) {
							if (error) {
								isError = true;
								if (config.remove_error_file) {
									_otherDir.push(uri);
								} else {
									errorMsg.push({
										uri: uri,
										_uri: _uri,
										msg: error
									});
								}
								checkCompressStep();
							} else {
								var originUri,
									newUri;

								if (file.type == "css" && config.export_by_css_style) {
									var extname = path.extname(uri);
									if (extname != '.css') {
										originUri = uri;
										uri = uri.replace(new RegExp(extname + '$'), '.css');
									}
								}
								try {
									(function(){
										var _uri = uri.replace(to, originTo),
											uriPath = path.dirname(_uri);;
										if (_otherDir.indexOf(_uri) == -1) {
											if (!path.existsSync(uriPath)) {
												execute('mkdir', ['-p', uriPath], {
													onComplete: function(data) {
														fs.writeFileSync(_uri, code);
														if (originUri) {
															try {
																fs.unlinkSync(originUri);
															} catch (e) {}
														}
														checkCompressStep();
													}
												});
											} else {
												fs.writeFileSync(_uri, code);
												checkCompressStep();
											}
										}
									})();
								} catch (e) {}
							}
						});
					} catch (e) {
						var msg = e.message;
						isError = true;
						console.log('\033[22;37myou\033[0m', '\033[01;32mCompress\033[0m', '\033[22;31mError \033[0m', _uri);
						errorMsg.push({
							uri: uri,
							_uri: _uri,
							msg: msg.replace(to, '')
						});
						checkCompressStep();
					}
					if (!isError) {
						console.log('\033[01;37myou\033[0m', '\033[01;32mCompress\033[0m', '\033[01;33m' + ((new Date().getTime() - lastTime) / 1000).toFixed(3) + 's\033[0m', _uri);
					}
				});
			});


			compressQue.add(function() {
				// 如果有错误时
				if (errorMsg.length) {
					console.log('\033[01;37myou\033[0m', '\033[22;31mCompress fail');
					console.log(errorMsg.length + ' Error:');
					errorMsg.forEach(function(msg) {
						console.log(msg._uri + ':\n\t' + msg.msg);
					});
					$util.log('\033[0m');
				} else {

					var copyQue = que(),
						currentCount = 0
						maxCount = 0;

					// copy js 和 css
					(function(js, css, other) {
						var files = [].concat(js).concat(css).concat(other);

						files.forEach(function(uri) {
							if (!uri) return;
							var originUri = uri.replace(to, originTo),
								uriPath = path.dirname(originUri);;
							maxCount++;
							if (_otherDir.indexOf(uri) == -1 && path.existsSync(uri)) {
								var code = fs.readFileSync(uri);
								if (!path.existsSync(uriPath)) {
									execute('mkdir', ['-p', uriPath], {
										onComplete: function(data) {
											fs.writeFileSync(originUri, code);
											currentCount++;
											if (currentCount == maxCount){
												copyQue.fire();
											}
										}
									});
								} else {
									fs.writeFileSync(originUri, code);
									currentCount++;
									if (currentCount == maxCount){
										copyQue.fire();
									}
								}
							}
						});
					})([], [], files.other);

					copyQue.add(function() {
						execute('chmod', ['777', originTo, '-R'], {
							onComplete: function() {
								removeFolder(to, {
									onComplete: function() {
										console.log('\033[01;37myou\033[0m', '\033[01;32mCompress\033[0m', '\033[22;33mSuccess\033[0m', '\n\033[22;33m' + len + ' files\'s time is', ((new Date().getTime() - startTime) / 1000).toFixed(3) + 's\033[22;0m\n');
									}
								});
							}
						});
					});
				}
			});
		};

		if (from) {
			// 复制并压缩
			execute('cp', ['-rf', from, to], {
				onComplete: _compress
			});
		} else {
			var tempName = 'temp_you_' + new Date().getTime(),
				temp = path.normalize(to + '/' + tempName);
			to = temp;
			var maxCount = 0,
				currentCount = 0,
				isCompressing;

			execute('mkdir', ['-p', to], {
				onComplete: function() {
					fs.readdirSync(originTo).forEach(function(dir) {
						var from;
						if (dir != tempName) {
							maxCount++;
							from = originTo + '/' + dir;
							execute('cp', ['-rf', from, to + '/' + dir], {
								onComplete: function() {
									removeFolder(from);
									currentCount++;
									if (currentCount == maxCount && !isCompressing) {
										isCompressing = true;
										_compress();
									}
								}
							});
						}
					});
				}
			});
		}
	}

	/**
	 * SVN export
	 * @param   {[type]}  url       [description]
	 * @param   {[type]}  username  [description]
	 * @param   {[type]}  password  [description]
	 * @param   {[type]}  target    [description]
	 * @param   {[type]}  Opts      [description]
	 * @return  {[type]}            [description]
	 */
	function svnExport(url, username, password, target, Opts) {
		Opts = Opts || {};
		if (path.existsSync(target)) {
			console.log('\033[01;37myou\033[0m', '\033[01;32mExport\033[0m', url);
			removeFolder(target, {
				onComplete: function(data) {
					var params = ['export', '--non-interactive', '--force', '--username', username, '--password', password, url, target];
					Opts.onProgress = function(data, code) {
						data.toString().split('\n').forEach(function(msg) {
							if (msg) {
								$util.print('.');
								//	console.log('\033[01;37myou\033[0m','\033[01;32mexport  \033[0m',msg.trim().replace(target,''));
							}
						});
					};
					execute('svn', params, Opts);
				},
				onError: function(data) {
					data.toString().split('\n').forEach(function(msg) {
						msg && console.log(msg);
					});
				}
			});
		} else {
			console.log('found out ' + target);
			console.log('mkdir ' + target);
			execute('mkdir', ['-p', target], {
				onComplete: function(data) {
					svnExport(url, username, password, target, Opts);
				}
			});
		}
	}

	/**
	 * 清空文件
	 * @param   {[type]}    uri       [description]
	 * @param   {Function}  callback  [description]
	 * @return  {[type]}              [description]
	 */

	function removeFolder(uri, Opts) {
		execute('rm', ['-rf', uri], Opts);
	}

	/**
	 * 执行代码
	 * @param   {[type]}    cmd       [description]
	 * @param   {[type]}    params    [description]
	 * @param   {[type]}    Opts       [description]
	 */

	function execute(cmd, params, Opts) {
		Opts = Opts || {};
		var spawnedProcess = spawn(cmd, params);
		spawnedProcess.stdout.on('data', Opts.onProgress || function() {});
		spawnedProcess.stderr.on('data', Opts.onError || function() {});
		spawnedProcess.on('exit', Opts.onComplete || function() {});
	}

	/**
	 * 不打包
	 * @return  {Boolean}  [description]
	 */
	function isCompressFilePath(uri, files, type) {
		var re = false;

		if (files.length) {
			files.forEach(function(value) {
				if (uri.indexOf(type + '' + value) != -1) {
					re = true;
				}
			});
		}

		return re;
	}

	/**
	 * rm dir
	 * @param   {[type]}  path  [description]
	 * @return  {[type]}        [description]
	 */
	function deleteFolderRecursive(path) {
		if (fs.existsSync(path)) {
			fs.readdirSync(path).forEach(function(file, index) {
				var curPath = path + "/" + file;
				if (fs.statSync(curPath).isDirectory()) { // recurse
					deleteFolderRecursive(curPath);
				} else { // delete file
					fs.unlinkSync(curPath);
				}
			});
			fs.rmdirSync(path);
		}
	};

	function isPrivateURI(uri) {
		var basename = path.basename(uri),
			s = basename.charAt(0);

		return s == '_' || s == '.';
	}


	function que() {
		var that = {},
			isFire = false,
			list = [];

		that.fire = function() {
			isFire = true;
			list.forEach(function(fn) {
				fn && fn();
			});
		};

		that.add = function(fn) {
			if (!isFire) {
				fn && list.push(fn);
			} else {
				fn();
			}
		};
		return that;
	}

	module.exports = {
		compress: compress,
		svnExport: svnExport,
		removeFolder: removeFolder,
		execute: execute
	};
})(module);