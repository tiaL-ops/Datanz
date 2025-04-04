const assert = require('assert');
const AuthModel = require('../models/AuthModel');

describe('AuthModel', function() {
  describe('createUser', function() {
    it('should create a new user and return the user object with proper properties', function() {
      // Create a fake database object.
      const fakeDB = {
        prepare: function(query) {
          return {
            run: function(name, email, password, createdAt) {
              // Simulate a successful insert returning a new ID.
              return { lastInsertRowid: 42 };
            }
          };
        }
      };

      // Instantiate AuthModel with the fake database.
      const authModel = new AuthModel(fakeDB);

      // Call createUser with sample data.
      const userData = authModel.createUser('john_jones', 'john@example.com', 'password123');

      // Verify the returned object contains the expected properties.
      assert.strictEqual(userData.user_id, 42);
      assert.strictEqual(userData.username, 'john_jones');
      assert.strictEqual(userData.email, 'john@example.com');
      assert.ok(typeof userData.created_at === 'string' && userData.created_at.length > 0);
    });
  });
});

