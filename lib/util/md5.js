/**
 * 计算文件内容md5值
 */ (function(exports) {
	var fs = require('fs'),
		path = require('path'),
		console = require('console'),
		crypto = require('crypto');

	//异步式计算文件md5
	exports.MD5 = function(filePath, callback) {
		callback = callback || function(hash) {
			console.log('md5 hash is: ' + hash);
		};

		var checksum = crypto.createHash('md5');
		var fin = fs.ReadStream(filePath);

		fin.on('data', function(data) {
			checksum.update(data);
		});

		fin.on('error', function(exception) {
			console.error('Unable to read the file :' + exception);
			process.exit();
		});

		fin.on('end', function() {
			callback(checksum.digest('hex')); //checksum.digest('hex') is the md5 hash
		});
	};

	//同步式计算字符串md5
	exports.syncMD5 = function(str) {
		return crypto.createHash('md5').update(str).digest("hex");
	};

	var cssMapping = {};
	//同步式计算css md5
	exports.cssMD5 = function(uri, sCSS) {
		var hash = crypto.createHash('md5').update(sCSS).digest("hex").substr(0, 16); //hex为32位
		cssMapping[uri] = hash;
		return hash;
	};
	exports.getCssMD5Mapping = function(str, key) {
		return cssMapping;
	};

	//同步式计算字符串md5,并且保留文件名称
	var mapping = {};
	exports.syncMD5forFile = function(str, key) {
		var hash = crypto.createHash('md5').update(str).digest("hex").substr(0, 16); //hex为32位
		mapping[key] = hash;
		return hash;
	};
	exports.getMD5Mapping = function() {
		return mapping;
	};

	//同步式计算文件md5--计算结果和异步stream式计算的结果一致
	exports.syncFileMD5 = function(filePath) {
		return this.syncMD5(fs.readFileSync(filePath));
	};



	//原始文件路径 : md5后得到的文件路径
	var cache = exports.cache = {};

	//边计算文件md5,边流式copy该文件.
	exports.MD5AndCopyFile = function(filePath, callback) {
		callback = callback || function(data) {
			console.log('md5 hash is: ' + data.hash, 'file mapping is: ' + data.cache);
		};

		var hash;
		var checksum = crypto.createHash('md5');
		var fin = fs.ReadStream(filePath);
		var fout = fs.createWriteStream(filePath + "_tmp_");

		fin.on('data', function(data) {
			checksum.update(data);
		});

		fin.on('error', function(exception) {
			console.error('Unable to read the file :' + exception);
			process.exit();
		});

		fin.on('end', function() {
			hash = checksum.digest('hex');
			fs.realpath(filePath, function(err, resolvedPath) {
				if (err) {
					throw err;
					process.exit();
				}
				//resolvedPath是原始文件的绝对路径
				var extname = path.extname(resolvedPath),
					newFileName = path.basename(resolvedPath, extname) + "_" + hash + extname,
					newFilePath = path.dirname(resolvedPath) + "/" + newFileName;
				fs.rename(resolvedPath + "_tmp_", newFilePath);

				cache[resolvedPath] = newFilePath;

				callback({
					hash: hash,
					cache: cache
				});
			});
		});
		fin.pipe(fout);
	};
})(exports);

/*
var md5 = require('./md5.js').MD5;
md5('xxx/xxx.js',function(hash){
	console.log('md5 hash is:', hash);
});
*/