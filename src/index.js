var Hapi = require('hapi');
var path = require('path');

var server = new Hapi.Server();

var DAO = require('./DAO.js');
DAO.init();
server.connection({ port: 3000 });


server.register([require('vision'), require('inert')], function (err) {

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

	server.route({
	    method: 'GET',
	    path: '/img/{param*}',
	    handler: {
	    	directory: {
            	path: path.resolve(__dirname,'img'),
            	listing: true
            }
        }
	});

	server.route({
	    method: 'GET',
	    path: '/static/{param*}',
	    handler: {
	    	directory: {
            	path: path.resolve(__dirname,'static'),
            	listing: true
            }
        }
	});

	server.route({
	    method: 'GET',
	    path: '/products',
	    handler: function (request, reply) {

			DAO.getAllProducts(function(err, data) {
				//TODO: if err, show 404
				reply.view('productList', {products: data});
			});
		}
	});

	server.route({
	    method: 'GET',
	    path: '/products/{id}',
	    handler: function (request, reply) {
			//request.params.user
			DAO.getProduct(request.params.id, function(err, data) {
				//TODO: if err, show 404
				reply.view('product', data);
			});
		}
	});
});


server.start(function () {
    console.log('Server running at:', server.info.uri);
});