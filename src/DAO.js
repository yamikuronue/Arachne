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

	},

	get: function(id, callback) {
		var stmt = db.prepare("SELECT * FROM products WHERE id=?");
		stmt.get(id, callback);
	}
}

module.exports = DAO;