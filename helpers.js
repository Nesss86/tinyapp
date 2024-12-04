const bcrypt = require('bcryptjs');

const hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

const comparePasswords = (plainPassword, hashedPassword) => {
  return bcrypt.compareSync(plainPassword, hashedPassword);
};

const getUserByEmail = (email, userDatabase) => {
  return Object.values(userDatabase).find(user => user.email === email);
};

const getUserById = (id) => {
  return users[id];
};

const urlsForUser = (id) => {
  const userUrls = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userId === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
};

const generateRandomString = () => {
  return Math.random().toString(36).substring(2, 8);
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10), // Hashed password
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10), // Hashed password
  },
};

const urlDatabase = {
  b2xVn2: { longURL: "http://www.lighthouselabs.ca", userId: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userId: "user2RandomID" },
};

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
