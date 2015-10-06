var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');


var DAO = {
	init: function() {

	}
}

module.exports = DAO;