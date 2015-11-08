var Hapi = require('hapi');
var path = require('path');
var moment = require('moment');
var fs = require('fs');

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
	
	/*Static routes*/
	
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

	/* Purchase funnel routes*/
	server.route({
	    method: 'GET',
	    path: '/',
	    handler: function (request, reply) {
	        reply.view('home');
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
		path: '/checkout',
		handler: function (request, reply) {
			var data = {};
			data.product = request.payload.product;
			data.pricePerItem = request.payload.pricePerItem;
			data.quantity = request.payload.quantity;
			data.itemTotal = data.pricePerItem * data.quantity;
			data.total = data.itemTotal + 5; //Static shipping charge: $5
		
			console.log(data);
			reply.view('cart', data);	
		}
	});
	
	server.route({
		method: 'POST',
		path: '/processCreditCard',
		handler: function (request, reply) {
			var data = {};
			var valid = true;
			data.errorMsg = "";
			
			//Regex validation patterns
			var isValidState = /^(A[LKSZRAEP]|C[AOT]|D[EC]|F[LM]|G[AU]|HI|I[ADLN]|K[SY]|LA|M[ADEHINOPST]|N[CDEHJMVY]|O[HKR]|P[ARW]|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY])$/i;
			var isValidZip = /(^\d{5}$)|(^\d{5}-\d{4}$)/;
			
			//Credit cards
			var isValidVisa = /^4[0-9]{12,15}$/;
			var isValidMastercard = /^5[1-5][0-9]{14}$/;
			var isValidAmex = /^3[47][0-9]{14}$/;
			var isValidDiscover = /^6(?:011|5[0-9]{2})[0-9]{12}$/;
			
			//Validate address
			if (!isValidState.test(request.payload.state)) {
				valid = false;
				data.errorMsg += "Invalid state.";
			}
			
			if (!isValidZip.test(request.payload.zip)) {
				valid = false;
				data.errorMsg += "Invalid zip.";
			}
			
			switch (request.payload.cardType) {
				case "visa":
					if (!isValidVisa.test(request.payload.card)) {
						valid = false;
						data.errorMsg += "Invalid credit card number";
					}
					break;
				case "amex":
					if (!isValidVisa.test(request.payload.card)) {
						valid = false;
						data.errorMsg += "Invalid credit card number";
					}
					break;
				case "master":
					if (!isValidMastercard.test(request.payload.card)) {
						valid = false;
						data.errorMsg += "Invalid credit card number";
					}
					break;
				case "discover":
					if (!isValidDiscover.test(request.payload.card)) {
						valid = false;
						data.errorMsg += "Invalid credit card number";
					}
					break;
			}
		
			//Date is like 1988-06
			var expDate = moment(request.payload.exp, "YYYY-MM");
			var currDate = moment();
			if (expDate.isBefore(currDate)) {
				valid = false;
				data.errorMsg += "Card is expired!";
			}
			
			if (!valid) {
				data.product = request.payload.product;
				data.pricePerItem = request.payload.pricePerItem;
				data.quantity = request.payload.quantity;
				data.itemTotal = request.payload.itemTotal;
				data.total = request.payload.total;
				
				reply.view('cart', data);
			} else {
				reply.view('success', data);
			}
		}
	});

	/*Admin routes*/
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
			var data = {};
			data.isHome = true;
			data.username = request.auth.credentials.username;
			reply.view('admin_home', data);
		},
		config: {
			auth: {
				strategy: 'session',
				mode: 'required'
			}
		}
	});
	
	server.route({
	    method: 'GET',
	    path: '/admin/users',
	    handler: function (request, reply) {
			
			var data = {};
			data.username = request.auth.credentials.username;
			data.isUsers = true;
			
			DAO.getAllUsers(function(err, users) {
				if (err) {
					data.msg = err.toString();
				};
				
				data.users = users;
				reply.view('admin_userEdit', data);
			});
		},
		config: {
			auth: {
				strategy: 'session',
				mode: 'required'
			}
		}
	});
	
	server.route({
	    method: 'POST',
	    path: '/admin/users',
	    handler: function (request, reply) {
			
			var data = {};
			data.username = request.auth.credentials.username;
			data.isUsers = true;
			
			DAO.addUser(request.payload.username, request.payload.pw, function(err) {
				DAO.getAllUsers(function(err, users) {
					if (err) {
						data.msg = err.toString();
					};
					
					data.users = users;
					reply.view('admin_userEdit', data);
				});
			});
		},
		config: {
			auth: {
				strategy: 'session',
				mode: 'required'
			}
		}
	});
	
	server.route({
	    method: 'POST',
	    path: '/admin/users/{name}',
	    handler: function (request, reply) {
			
			var data = {};
			data.username = request.auth.credentials.username;
			data.isUsers = true;
			
			if (request.params.name != "admin") {
				DAO.changePass(request.params.name, request.payload.pw, function(err) {
					if (err) {
						data.msg = err.toString();
					} else {
						data.msg = "Password for " + request.params.name + " changed.";
					};
					
					DAO.getAllUsers(function(err, users) {
						if (err) {
							data.msg += err.toString();
						};
						
						data.users = users;
						reply.view('admin_userEdit', data);
					});
				});
			}
		},
		config: {
			auth: {
				strategy: 'session',
				mode: 'required'
			}
		}
	});
	
	server.route({
	    method: 'GET',
	    path: '/admin/products',
	    handler: function (request, reply) {
			
			var data = {};
			data.username = request.auth.credentials.username;
			data.isProducts = true;
			data.msg = "";
			DAO.getAllProducts(function(err, products) {
				if (err) {
					data.msg += err.toString();
				};
				
				data.products = products;
				DAO.getAllImages(function(err1, images) {
					if (err1) {
						data.msg += err.toString();
					};
					
					data.images = images;
					reply.view('admin_productEdit', data);
				});
			});
		},
		config: {
			auth: {
				strategy: 'session',
				mode: 'required'
			}
		}
	});
	
	server.route({
	    method: 'POST',
	    path: '/admin/products/{id}',
	    handler: function (request, reply) {
			DAO.updateProduct(request.params.id, request.payload.name, request.payload.info, request.payload.price, request.payload.image, function(err, products) {
				if (err) console.log(err);
				reply.redirect('/admin/products');
			});
			
		},
		config: {
			auth: {
				strategy: 'session',
				mode: 'required'
			}
		}
	});
	
	server.route({
	    method: 'GET',
	    path: '/admin/images',
	    handler: function (request, reply) {
			
			var data = {};
			data.username = request.auth.credentials.username;
			data.isUsers = true;
			DAO.getAllImages(function(err, images) {
				if (err) {
					data.msg = err.toString();
				};
				
				data.images = images;
				reply.view('admin_imageEdit', data);
			});
		},
		config: {
			auth: {
				strategy: 'session',
				mode: 'required'
			}
		}
	});
	
	server.route({
	    method: 'POST',
	    path: '/admin/images',
	    handler: function (request, reply) {
			
			var data = {};
			data.username = request.auth.credentials.username;
			data.msg = "";
			data.isUsers = true;
			
			var filename = request.payload.file.hapi.filename;			
			var path = __dirname + "/img/" + filename;
			var file = fs.createWriteStream(path);

			file.on('error', function (err) { 
				data.msg += err.toString();
			});

			request.payload.file.pipe(file);

			request.payload.file.on('end', function (err) {
				if (err) {
					data.msg += err.toString();
				};
				DAO.addImage(request.payload.title, filename, function(err1) {
					if (err1) {
						data.msg += err1.toString();
					};
						
					DAO.getAllImages(function(err2, images) {
						if (err2) {
							data.msg += err2.toString();
						};
						
						data.images = images;
						reply.view('admin_imageEdit', data);
					});
				});
			});
			
			
		},
		config: {
			auth: {
				strategy: 'session',
				mode: 'required'
			},
			 payload: {
				maxBytes: 209715200,
				output: 'stream',
				uploads: __dirname + '/img/',
				parse: true
			}
		}
	});
});


server.start(function () {
    console.log('Server running at:', server.info.uri);
});