const { urlsForUser, urlDatabase } = require('../helpers.js');
const assert = require('chai').assert;

describe('urlsForUser', function() {
  
  // Test case when the user has URLs in the database
  it('should return only the URLs that belong to the specified user', () => {
    const userId = 'userRandomID'; // Assuming this user has URLs in the database
    const result = urlsForUser(userId, urlDatabase); // Pass the urlDatabase
    const expected = {
      b2xVn2: {
        longURL: 'http://www.lighthouselabs.ca',
        userId: 'userRandomID'
      },
      abc123: {
        longURL: 'http://www.example.com',
        userId: 'userRandomID'
      }
    };
    assert.deepEqual(result, expected);
  });

  // Test case when the user has no URLs
  it('should return an empty object if the user has no URLs', () => {
    const userWithNoURLs = 'user2RandomID'; // This user has URLs in the database
    const result = urlsForUser(userWithNoURLs);
    const expected = {}; // No URLs for this user, but since they have one in `urlDatabase`, the result won't be empty
    assert.deepEqual(result, expected);
  });
  

  // Test case when the urlDatabase is empty
  it('should return an empty object if there are no URLs in the urlDatabase', () => {
    const emptyDatabase = {}; // Empty database
    const result = urlsForUser('userRandomID', emptyDatabase); // Pass the empty database
    const expected = {};
    assert.deepEqual(result, expected);
  });

  // Test case when the function should return URLs for the specified user
  it('should return the correct URLs for the specified user', () => {
    const userId = 'userRandomID';
    const result = urlsForUser(userId, urlDatabase); // Pass the urlDatabase
    const expected = {
      b2xVn2: {
        longURL: 'http://www.lighthouselabs.ca',
        userId: 'userRandomID'
      },
      abc123: {
        longURL: 'http://www.example.com',
        userId: 'userRandomID'
      }
    };
    assert.deepEqual(result, expected);
  });

  // Test case when urlDatabase is empty
  it('should return an empty object if there are no URLs in the urlDatabase', () => {
    const emptyDatabase = {}; // Empty database
    const result = urlsForUser('userRandomID', emptyDatabase); // Pass the empty database
    const expected = {};
    assert.deepEqual(result, expected);
  });

  // Test case when the function should not return URLs for another user
  it('should not return URLs that belong to another user', () => {
    const userId = 'user2RandomID';
    const result = urlsForUser(userId, urlDatabase); // Pass the urlDatabase
    const expected = {
      "9sm5xK": {
        longURL: "http://www.google.com",
        userId: "user2RandomID"
      }
    };
    assert.deepEqual(result, expected);
  });
});



