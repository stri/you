module.exports = function(you) {
	var combine = you.getCombineObject();


	function addComment(Opts) {
		if (Opts.file.type == 'js') {
			return '// 这里JS注释\n';
		}

		if (Opts.file.type == 'css') {
			return '// 这里CSS注释\n';
		}
	};

	you.getCombineObject = function(Opts, callback) {
		return combine(Opts, function(code) {
			code = addComment(Opts) + code;
			callback && callback(code);
			return code;
		});
	}

	return you;
};