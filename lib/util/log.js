var params = process.argv.slice(4).join(" ");
var verbose = params.indexOf('-v') !== -1 || params.indexOf('-verbose') !== -1;
exports.info = function(info) {
	//因为大量console.log严重影响性能,所以需要一个配置开关
	verbose && console.log(info);
};

var errors = [];

exports.error = function(err) {
	errors.push(err);
};

exports.getError = function() {
	return errors;
};

exports.errorInfo = function(err) {
	console.error(err);
};

var warnings = [];

exports.warning = function(wrn) {
	if (warnings.indexOf(wrn) === -1) {
		warnings.push(wrn);
	}
};

exports.getWarning = function() {
	return warnings;
};

exports.warningInfo = function(wrn) {
	console.warn(wrn);
};

exports.log2 = function(type, status, uri) {
	console.log('\033[01;37myou\033[0m', '\033[01;32m' + type + '\033[0m', '\033[01;33m' + status + '\033[0m', uri ? uri : '');
}

exports.log3 = function(type, status, uri) {
	console.log('\033[01;37myou\033[0m', '\033[01;32m' + type + '\033[0m', '\033[01;31m' + status + '\033[0m', uri ? uri : '');
}