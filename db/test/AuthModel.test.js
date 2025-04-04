const assert = require('assert');
const AuthModel = require('../models/AuthModel');

describe('AuthModel', function() {
  let fakeDB;
  let authModel;

  // Set up a fake DB object before each test so that we can simulate various queries.
  beforeEach(function() {
    fakeDB = {
      prepare: function(query) {
        if (query.includes("INSERT INTO Auth")) {
          return {
            run: function(name, email, password, createdAt) {
              // Simulate an insert that always returns the same ID.
              return { lastInsertRowid: 42 };
            }
          };
        } else if (query.includes("SELECT * FROM Auth WHERE username = ?")) {
          return {
            get: function(username) {
              // Return a fake user if the username matches; otherwise, null.
              if (username === 'jane_doe') {
                return {
                  user_id: 101,
                  username: 'jane_doe',
                  email: 'jane@example.com',
                  created_at: "2025-04-04T12:00:00Z"
                };
              }
              return null;
            }
          };
        } else if (query.includes("SELECT * FROM Auth WHERE user_id= ?")) {
          return {
            get: function(id) {
              // Return a fake user if the id matches.
              if (id === 101) {
                return {
                  user_id: 101,
                  username: 'jane_doe',
                  email: 'jane@example.com',
                  created_at: "2025-04-04T12:00:00Z"
                };
              }
              return null;
            }
          };
        } else if (query.includes("SELECT password FROM Auth WHERE email = ?")) {
          return {
            get: function(email) {
              // Return a fake password row for an existing email.
              if (email === 'jane@example.com') {
                return { password: 'securePass' };
              }
              return null;
            }
          };
        } else if (query.includes("SELECT * FROM Auth WHERE usertype = ?")) {
          return {
            all: function(role) {
              // Simulate returning arrays of users for different roles.
              if (role === 'doctor') {
                return [
                  { user_id: 201, username: 'doc1', email: 'doc1@example.com' },
                  { user_id: 202, username: 'doc2', email: 'doc2@example.com' }
                ];
              } else if (role === 'gov') {
                return [
                  { user_id: 301, username: 'gov1', email: 'gov1@example.com' }
                ];
              }
              return [];
            }
          };
        }
        // Default stub in case no query matches.
        return {
          run: () => {},
          get: () => null,
          all: () => []
        };
      }
    };

    // Instantiate the AuthModel with the fake database.
    authModel = new AuthModel(fakeDB);
  });

  describe('createUser', function() {
    it('should create a new user and return the user object with proper properties', function() {
      const user = authModel.createUser('john_doe', 'john@example.com', 'password123');
      assert.strictEqual(user.user_id, 42);
      assert.strictEqual(user.username, 'john_doe');
      assert.strictEqual(user.email, 'john@example.com');
      assert.ok(typeof user.created_at === 'string' && user.created_at.length > 0);
    });
  });

  describe('findByUsername', function() {
    it('should return the user if the username exists', function() {
      const user = authModel.findByUsername('jane_doe');
      assert.strictEqual(user.user_id, 101);
      assert.strictEqual(user.username, 'jane_doe');
      assert.strictEqual(user.email, 'jane@example.com');
    });

    it('should return null if the username does not exist', function() {
      const user = authModel.findByUsername('nonexistent');
      assert.strictEqual(user, null);
    });
  });

  describe('findByID', function() {
    it('should return the user if the id exists', function() {
      const user = authModel.findByID(101);
      assert.strictEqual(user.user_id, 101);
      assert.strictEqual(user.username, 'jane_doe');
      assert.strictEqual(user.email, 'jane@example.com');
    });

    it('should return null if the id does not exist', function() {
      const user = authModel.findByID(999);
      assert.strictEqual(user, null);
    });
  });

  describe('validatePassword', function() {
    it('should return true if the password matches the stored password', function() {
      const isValid = authModel.validatePassword('securePass', 'jane@example.com');
      assert.strictEqual(isValid, true);
    });

    it('should return false if the user does not exist or the password does not match', function() {
      const nonExistent = authModel.validatePassword('anything', 'nonexistent@example.com');
      assert.strictEqual(nonExistent, false);

      const wrongPass = authModel.validatePassword('wrongPass', 'jane@example.com');
      assert.strictEqual(wrongPass, false);
    });
  });

  describe('getAllUsersByRole', function() {
    it('should return an array of users for the role "doctor"', function() {
      const doctors = authModel.getAllUsersByRole('doctor');
      assert.strictEqual(doctors.length, 2);
      assert.strictEqual(doctors[0].username, 'doc1');
    });

    it('should return an array of users for the role "gov"', function() {
      const govUsers = authModel.getAllUsersByRole('gov');
      assert.strictEqual(govUsers.length, 1);
      assert.strictEqual(govUsers[0].username, 'gov1');
    });

    it('should return an empty array if no users exist for the given role', function() {
      const patients = authModel.getAllUsersByRole('patient');
      assert.strictEqual(patients.length, 0);
    });
  });
});
