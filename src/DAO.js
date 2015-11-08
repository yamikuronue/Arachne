var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');


var DAO = {
	init: function() {
		db.serialize(function() {
			/* Product images*/
			db.run("CREATE TABLE images (id INTEGER PRIMARY KEY,  title TEXT, filename TEXT)");
			//Default images
			var stmt = db.prepare("INSERT INTO images(id, title, filename) VALUES (?,?,?)");
			stmt.run("1",
				"Child with net",
				"child_with_net.jpg"
				);
				
			stmt.run("2",
				"Terrerium",
				"Terrerium.jpg"
				);
				
			stmt.run("3",
				"Vine leaf",
				"vine-leaf.jpg"
				);
			stmt.finalize();
			
			/* Products */
			db.run("CREATE TABLE products (id INTEGER PRIMARY KEY,  name TEXT, info TEXT, price INTEGER, imgID INTEGER)");

			//Default product values
			stmt = db.prepare("INSERT INTO products(id, name, info, price, imgID) VALUES (?,?,?,?,?)");
			stmt.run("1",
				"Bug Catching Net",
				"This beautiful net will help you catch all the butterflies in the world! On clearance!",
				"25",
				"1");
			
			stmt.run("2",
				"Bug Habitat",
				"A lovely habitat for the bugs you caught. Best seller!",
				"25",
				"2");

			stmt.run("3",
				"Bug Bait",
				"No bugs to catch? This bait will lure them out of hiding.",
				"25",
				"3");
			stmt.finalize();
		});

		/* Users*/
		db.serialize(function() {
			db.run("CREATE TABLE users (name TEXT, password TEXT, canAdminUsers INTEGER)");

			//Default users
			var stmt = db.prepare("INSERT INTO users(name, password, canAdminUsers) VALUES (?,?,?)");
			stmt.run("admin",
				"password",
				"1");
				
			stmt.run("user",
				"password",
				"0");
			stmt.finalize();
		});

	},

	/* Product functions*/
	getProduct: function(id, callback) {
		var stmt = db.prepare("SELECT products.id, products.name, products.info, products.price, images.filename AS img FROM products INNER JOIN images ON products.imgID = images.id WHERE products.id=?");
		stmt.get(id, callback);
	},

	getAllProducts: function(callback) {
		db.all("SELECT products.id, products.name, products.info, products.price, images.filename AS img FROM products INNER JOIN images ON products.imgID = images.id", callback);
	},
	
	addProduct: function(name, info, price, imageID, callback) {
		db.run("INSERT INTO products(name, info, price, imgID) VALUES (?,?,?,?)", [name, info, price, imageID], callback);
	},
	
	getAllImages: function(callback) {
		db.all("SELECT * FROM images", callback);
	},
	
	addImage: function(title, filename, callback) {
		db.run("INSERT INTO images(title, filename) VALUES (?,?)", [title, filename], callback);
	},
	
	/* User functions*/
	getAllUsers: function(callback) {
		db.all("SELECT * FROM users WHERE name != 'admin'", callback);
	},
	
	addUser: function(username, password, callback) {
		db.run("INSERT INTO users(name, password, canAdminUsers) VALUES (?,?,?)", [username, password, "0"], callback);
	},
	
	changePass: function(username, password, callback) {
		db.run("UPDATE users SET password=? WHERE name=?", [password, username ], callback);
	},

	isValidUser: function(username, callback) {
		db.get("SELECT * FROM users WHERE name='" + username + "'", function(err, row) {
			if (row) {
				callback(err, true);
			} else {
				callback(err, false);
			}
		});
	},

	checkAuth: function(username, password, callback) {
		db.get("SELECT * FROM users WHERE name='" + username + "' AND password='" + password +"'", function(err, row) {
			if (row) {
				callback(err, true);
			} else {
				callback(err, false);
			}
		});
	}
}

module.exports = DAO;