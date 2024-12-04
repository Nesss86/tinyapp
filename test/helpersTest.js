// Grouping tests for the urlsForUser function
describe('urlsForUser', function() {

  // I want to make sure this function returns the correct URLs for the specified user.
  it('should return only the URLs that belong to the specified user', () => {
    const userId = 'userRandomID'; // A user with multiple URLs in the database
    const result = urlsForUser(userId, urlDatabase); // Call the function with sample data
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
    // This will help validate that the function filters URLs by user ID.
    assert.deepEqual(result, expected);
  });

  // The reason I added this test is to ensure the function handles users with no URLs properly.
  it('should return an empty object if the user has no URLs', () => {
    const userWithNoURLs = 'user2RandomID'; // A user who doesn't own any URLs in this test
    const result = urlsForUser(userWithNoURLs); // Call without explicitly passing the database
    const expected = {}; // No URLs should be returned
    assert.deepEqual(result, expected);
  });

  // This test is meant to cover the edge case where the database is completely empty.
  it('should return an empty object if there are no URLs in the urlDatabase', () => {
    const emptyDatabase = {}; // Simulating an empty URL database
    const result = urlsForUser('userRandomID', emptyDatabase); // Call the function with an empty database
    const expected = {}; // Expect an empty result
    assert.deepEqual(result, expected);
  });

  // I included this test to confirm the function doesn’t mix up URLs between users.
  it('should not return URLs that belong to another user', () => {
    const userId = 'user2RandomID'; // A different user with their own URLs
    const result = urlsForUser(userId, urlDatabase); // Call the function with sample data
    const expected = {
      "9sm5xK": {
        longURL: "http://www.google.com",
        userId: "user2RandomID"
      }
    };
    // This test checks that only the correct user's URLs are returned.
    assert.deepEqual(result, expected);
  });
});




