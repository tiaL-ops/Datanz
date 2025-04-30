
const bcrypt = require('bcrypt');
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


async createUser(name, email, password,usertype) {
    const createdAt = new Date().toISOString();

    const query = `
        INSERT INTO Auth (username, email, password, usertype,created_at)
        VALUES (?, ?, ?, ?,?)
    `;

    const stmt = this.db.prepare(query);
    const info = stmt.run(name, email, password, usertype,createdAt);

    return {
        user_id: info.lastInsertRowid,
        username: name,
        email,
        usertype,
        created_at: createdAt
    };
}

findByID(id) {
    const query = `
      SELECT * FROM Auth WHERE user_id= ?
    `;
    const stmt = this.db.prepare(query);
    const user = stmt.get(id); 
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

  getUserByEmail(email) {
    const query = `
      SELECT * FROM Auth WHERE email = ?
    `;
    const stmt = this.db.prepare(query);
    const user = stmt.get(email); 
    return user;
  }

  async validatePassword(inputPassword, hashedPassword) {
    return await bcrypt.compare
 /*   const query = `
      SELECT password FROM Auth WHERE email = ?
    `;
    
    const stmt = this.db.prepare(query);
    const row = stmt.get(email);
  
    if (!row) return false; 
    const match = await this.bcrypt.compare(inputPassword, row.password);
  
    return match;*/
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