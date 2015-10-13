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
	    path: 'templates',
	    partialsPath: 'templates/partials'
	});

	server.auth.scheme('cookie', function(server, options) { 
		return {
			authenticate: function(request, reply) {
				if (request.state.username) {
					DAO.isValidUser(request.state.username, function(err, isValid){
						reply.continue({
							credentials: {
								username: request.state.username
							}
						});
					});
				} else {
					return reply.view('login', {message: 'Please log in'});
				}
			}
		}
	})

	server.auth.strategy('session', 'cookie', { });

    server.state('username', {
	    ttl: null,
	    isSecure: false,
	    isHttpOnly: false,
	    encoding: 'none',
	    clearInvalid: false, // remove invalid cookies
	    strictHeader: true // don't allow violations of RFC 6265
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

	server.route({
		method: 'POST',
		path: '/login',
		handler: function (request, reply) {
		    if (request.auth.isAuthenticated) {
		        return reply.redirect('/admin');
		    }

	        if (!request.payload.username) {
	            return reply.view('login', {message: 'Missing username or password'}); 
	        }
	        else {
	            DAO.isValidUser(request.payload.username, function(err, isValid) {
	            	if (err) return reply.view('login', {message: "Error retrieving account information: " + err});

	            	if (!isValid) return reply.view('login', {message: "Invalid username"});

	            	if (request.payload.password) {
	            		DAO.checkAuth(request.payload.username, request.payload.password, function(err, isValid) {
	            		if (!isValid) return reply.view('login', {message: "Invalid password"});
	            		else {
		    				return reply.redirect('/admin').state('username', request.payload.username);
	            		}
	            	}) 
	            	} else {
		    			return reply.redirect('/admin').state('username', request.payload.username);
	            	}
	            });
	        };
		}
	});

	server.route({
	    method: 'GET',
	    path: '/admin',
	    handler: function (request, reply) {

			reply("Authenticated");
		},
		config: {
			auth: {
				strategy: 'session',
				mode: 'required'
			}
		}
	});
});


server.start(function () {
    console.log('Server running at:', server.info.uri);
});