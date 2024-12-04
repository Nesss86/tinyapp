// Import bcryptjs library for password hashing and comparison
const bcrypt = require('bcryptjs');

// Function to hash a password using bcrypt
// Takes a plain password string and returns a hashed version
const hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);  // 10 is the salt rounds used for hashing
};

// Function to compare a plain password with a hashed password
// Returns true if the passwords match, false otherwise
const comparePasswords = (plainPassword, hashedPassword) => {
  return bcrypt.compareSync(plainPassword, hashedPassword);  // Synchronously compares the passwords
};

// Function to get a user by their email from the user database
// Throws an error if no user database is provided
const getUserByEmail = (email, userDatabase) => {
  if (!userDatabase) {
    throw new Error("User database is not defined");  // Ensure the database is provided
  }
  // Searches the user database for a matching email and returns the user object
  return Object.values(userDatabase).find(user => user.email === email);
};

// Function to get a user by their ID from the user database
// Returns the user object corresponding to the given ID
const getUserById = (id, userDatabase) => {
  return userDatabase[id];  // Directly returns the user object by ID
};

// Function to get all URLs for a specific user
// Loops through the URL database and returns only the URLs belonging to the given user ID
const urlsForUser = (id, urlDatabase) => {
  const userUrls = {};  // Object to store URLs for the given user
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userId === id) {
      userUrls[shortURL] = urlDatabase[shortURL];  // Adds matching URLs to the userUrls object
    }
  }
  return userUrls;  // Returns the user's URLs
};

// Function to generate a random 6-character string
// Used to create short URL identifiers
const generateRandomString = () => {
  return Math.random().toString(36).substring(2, 8);  // Generates a random alphanumeric string
};

// Example user database with two users and hashed passwords
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10), // Hashed password for security
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10), // Hashed password for security
  },
};

// Example URL database with short URLs, long URLs, and associated user IDs
const urlDatabase = {
  b2xVn2: { longURL: "http://www.lighthouselabs.ca", userId: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userId: "user2RandomID" },
  abc123: { longURL: "http://www.example.com", userId: "userRandomID" }
};

// Exporting the helper functions and sample databases for use in other files
module.exports = { 
  getUserByEmail, 
  getUserById, 
  urlsForUser, 
  hashPassword, 
  comparePasswords,
  generateRandomString,
  users,
  urlDatabase 
};

