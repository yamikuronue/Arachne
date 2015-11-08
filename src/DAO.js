var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');


var DAO = {
	init: function() {
		db.serialize(function() {
			db.run("CREATE TABLE products (id INTEGER,  name TEXT, info TEXT, price INTEGER, img TEXT)");

			//Default product values
			var stmt = db.prepare("INSERT INTO products(id, name, info, price, img) VALUES (?,?,?,?,?)");
			stmt.run("1",
				"Bug Catching Net",
				"This beautiful net will help you catch all the butterflies in the world! On clearance!",
				"25",
				"child_with_net.jpg");
			
			stmt.run("2",
				"Bug Habitat",
				"A lovely habitat for the bugs you caught. Best seller!",
				"25",
				"Terrerium.jpg");

			stmt.run("3",
				"Bug Bait",
				"No bugs to catch? This bait will lure them out of hiding.",
				"25",
				"vine-leaf.jpg");
			stmt.finalize();
		});

		db.serialize(function() {
			db.run("CREATE TABLE users (name TEXT, password TEXT, canAdminUsers INTEGER)");

			//Default product values
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

	getProduct: function(id, callback) {
		var stmt = db.prepare("SELECT * FROM products WHERE id=?");
		stmt.get(id, callback);
	},

	getAllProducts: function(callback) {
		db.all("SELECT * FROM products", callback);
	},
	
	getAllUsers: function(callback) {
		db.all("SELECT * FROM users WHERE name != 'admin'", callback);
	},
	
	addUser: function(username, password, callback) {
		console.log("Adding user " + username);
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