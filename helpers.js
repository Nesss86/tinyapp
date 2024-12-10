const bcrypt = require("bcryptjs");

// Function to hash a password using bcrypt
const hashPassword = (password) => {
  return bcrypt.hashSync(password, 10); // 10 is the salt rounds used for hashing
};

// Function to compare a plain password with a hashed password
const comparePasswords = (plainPassword, hashedPassword) => {
  return bcrypt.compareSync(plainPassword, hashedPassword); // Synchronously compares passwords
};

// Function to get a user by their email from the user database
const getUserByEmail = (email, userDatabase) => {
  if (!userDatabase) {
    throw new Error("User database is not defined");
  }
  return Object.values(userDatabase).find((user) => user.email === email);
};

// Function to get all URLs for a specific user
const urlsForUser = (id, urlDatabase) => {
  const userUrls = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userId === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
};

// Function to generate a random 6-character string
const generateRandomString = () => {
  return Math.random().toString(36).substring(2, 8);
};

module.exports = {
  getUserByEmail,
  urlsForUser,
  hashPassword,
  comparePasswords,
  generateRandomString,
};


