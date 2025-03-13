<!-- To cretae teh database based on the csv > 
CREATE TABLE IF NOT EXISTS Auth (
user_id INTEGER PRIMARY KEY,
username TEXT NOT NULL UNIQUE,
usertype TEXT NOT  NULL,
email TEXT NOT NULL UNIQUE,
created_at TEXT NOT NULL
);
