const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080; // Default port 8080
require('dotenv').config();

// Users database
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

// Helper functions
function generateRandomString() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters[randomIndex];
  }
  return randomString;
}

// Optimized getUserByEmail function
function getUserByEmail(email) {
  return Object.values(users).find(user => user.email === email) || null;
}

function getUserById(id) {
  return users[id] || null;
}

function urlsForUser(id) {
  const userUrls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userId === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
}

function hashPassword(password) {
  try {
    return bcrypt.hashSync(password, 10);
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('HashingError');
  }
}

function comparePasswords(plainPassword, hashedPassword) {
  try {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    throw new Error('ComparisonError');
  }
}

app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  try {
    app.use(cookieSession({
      name: 'session',
      keys: [process.env.COOKIE_SECRET], // Use environment variable for secret keys
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }));
    next(); // Proceed to the next middleware
  } catch (error) {
    console.error("Session Error: ", error);
    res.status(500).send("There was an issue with session handling.");
  }
});
app.set("view engine", "ejs");
app.use(express.static('public'));

// Middleware to assign userEmail to res.locals
app.use((req, res, next) => {
  const userId = req.session.user_id; // Updated for cookie-session
  res.locals.userEmail = userId ? users[userId]?.email : null;
  next();
});

const checkLogin = (req, res, next) => {
  const userId = req.session.user_id; // Updated for cookie-session
  if (!userId || !users[userId]) {
    return res.redirect('/login');
  }
  next();
};

// URL database
const urlDatabase = {
  b2xVn2: { longURL: "http://www.lighthouselabs.ca", userId: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userId: "user2RandomID" },
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls", (req, res) => {
  const userId = req.session.user_id; // Updated for cookie-session
  const user = getUserById(userId);
  if (!user) {
    return res.status(401).send("Please log in to view URLs.");
  }

  const urls = urlsForUser(userId); // Filter URLs for the logged-in user
  res.render('urls_index', { urls });
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id; // Updated for cookie-session
  if (!userId || !users[userId]) {
    return res.redirect('/login');
  }

  res.render("urls_new", { userEmail: users[userId].email });
});

app.post('/urls', (req, res) => {
  const userId = req.session.user_id; // Updated for cookie-session
  if (!userId || !users[userId]) {
    return res.status(401).send('<h1>Unauthorized</h1><p>You must log in to shorten URLs.</p>');
  }

  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userId }; // Associate URL with the logged-in user
  res.redirect(`/urls/${shortURL}`);
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email and password cannot be empty!');
  }

  const foundUser = getUserByEmail(email);
  if (!foundUser || !comparePasswords(password, foundUser.password)) {
    return res.status(403).send('Invalid email or password.');
  }

  req.session.user_id = foundUser.id; // Updated for cookie-session
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  req.session = null; // Clear session
  res.redirect("/login");
});

app.post('/urls/:id/delete', (req, res) => {
  const shortURL = req.params.id;
  const userId = req.session.user_id; // Updated for cookie-session

  if (!userId || !users[userId]) {
    return res.status(401).send('You must be logged in to delete URLs.');
  }

  const urlEntry = urlDatabase[shortURL];
  if (!urlEntry || urlEntry.userId !== userId) {
    return res.status(403).send('You do not have permission to delete this URL.');
  }

  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

app.get('/login', (req, res) => {
  const userId = req.session.user_id; // Updated for cookie-session
  if (userId && users[userId]) {
    return res.redirect('/urls');
  }
  res.render('login');
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email and password cannot be empty!');
  }

  if (getUserByEmail(email)) {
    return res.status(400).send('Email already registered.');
  }

  const userId = generateRandomString();
  users[userId] = { id: userId, email, password: hashPassword(password) };

  req.session.user_id = userId; // Updated for cookie-session
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  const userId = req.session.user_id; // Updated for cookie-session
  if (userId && users[userId]) {
    return res.redirect('/urls');
  }
  res.render('register', { userEmail: null });
});
