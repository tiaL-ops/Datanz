const path = require("path");
const Database = require("better-sqlite3");

// Function to create and return a database connection
function connectToDatabase() {
  const dbPath = path.resolve(__dirname, "db.sqlite");
  const db = new Database(dbPath);

  // Enable foreign keys
  db.exec("PRAGMA foreign_keys = ON");
  //console.log('Connected to the SQLite database.');
  return db;
}
// Function to close the database connection
function closeDatabase(db) {
  db.close();
  //console.log("Database connection closed.");
}
module.exports = {
  connectToDatabase,
  closeDatabase,
};
