(function(module) {
	var server = require('./index');
	try{
		server.stop();
	}catch(e){}
	server.start();
})(module)