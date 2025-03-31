
/* This will ensure login info */

class AuthModel {

    constructor(db) {
      this.db = db;
    }

    /*ds

createUser(name,) – Register a new user

findByUsername(username) – Find user by username/email

findById(id) – Get user by ID

verifyPassword(inputPassword, hash) – Check login credentials

getAllUsersByRole(role) – List users by role (doctor, gov)
*/


createUser(name, email, password) {
    const createdAt = new Date().toISOString();

    const query = `
        INSERT INTO Auth (username, email, password, created_at)
        VALUES (?, ?, ?, ?)
    `;

    const stmt = this.db.prepare(query);
    const info = stmt.run(name, email, password, createdAt);

    return {
        user_id: info.lastInsertRowid,
        username: name,
        email,
        created_at: createdAt
    };
}

findByID(id) {
    const query = `
      SELECT * FROM Auth WHERE user_id= ?
    `;
    const stmt = this.db.prepare(query);
    const user = stmt.get(username); 
    return user;
  }
  

findByUsername(username) {
    const query = `
      SELECT * FROM Auth WHERE username = ?
    `;
    const stmt = this.db.prepare(query);
    const user = stmt.get(username); 
    return user;
  }
  

  validatePassword(inputPassword, email) {
    const query = `
      SELECT password FROM Auth WHERE email = ?
    `;
    
    const stmt = this.db.prepare(query);
    const row = stmt.get(email);
  
    if (!row) return false; 
  
    return row.password === inputPassword;
  }
  
  getAllUsersByRole(role) {
    const query = `
      SELECT * FROM Auth WHERE usertype = ?
    `;
    const stmt = this.db.prepare(query);
    const rows = stmt.all(role);
  
    return rows; 
  }
  
  

}

module.exports = AuthModel;