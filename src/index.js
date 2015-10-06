var Hapi = require('hapi');

var server = new Hapi.Server();
server.connection({ port: 3000 });


server.register(require('vision'), function (err) {

	server.views({
	    engines: {
	        html: require('handlebars')
	    },
	    relativeTo: __dirname,
	    path: 'templates'
	});

	server.route({
	    method: 'GET',
	    path: '/',
	    handler: function (request, reply) {
	        reply.view('home');
	    }
	});
});


server.start(function () {
    console.log('Server running at:', server.info.uri);
});