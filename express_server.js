// express_server.js
// This file sets up and runs the Express web server for the TinyApp project.
// It handles user authentication, URL shortening, and management of user-specific URLs. 
// Users can register, log in, and manage their personalized short URLs. 
// The app uses sessions to track user login state, bcrypt for password security, 
// and EJS for rendering dynamic views.

const express = require("express");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const {
  getUserByEmail,
  urlsForUser,
  hashPassword,
  comparePasswords,
  generateRandomString,
} = require("./helpers");

const app = express();
const PORT = 8080;

// Application-specific data: Example user database
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

// Application-specific data: Example URL database
const urlDatabase = {
  b2xVn2: { longURL: "http://www.lighthouselabs.ca", userId: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userId: "user2RandomID" },
  abc123: { longURL: "http://www.example.com", userId: "userRandomID" },
};

// Set the view engine to EJS for rendering dynamic views
app.set("view engine", "ejs");

// I added body parser middleware to handle form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Use a static directory for serving images and other assets
app.use(express.static("public"));

// I set up session configuration to track user login state
app.use(
  cookieSession({
    name: "session",
    keys: ["secretKey1", "secretKey2"], 
    maxAge: 24 * 60 * 60 * 1000, 
  })
);

// Middleware to check if user is logged in
const checkUserLoggedIn = (req, res, next) => {
  if (!req.session.user_id) {
    return res.status(401).redirect("/login");  
  }
  next();
};

// Middleware to attach user info to the response object
const setUserInfo = (req, res, next) => {
  if (req.session.user_id) {
    const user = users[req.session.user_id]; // Fetch user directly from `users`
    res.locals.user = user || null;  
  } else {
    res.locals.user = null;
  }
  next();
};

// Apply middleware globally
app.use(setUserInfo);

// Routes

// Home page route
app.get("/", (req, res) => {
  res.render("home", { userEmail: res.locals.user ? res.locals.user.email : null });
});

// Show the "Create New URL" page
app.get("/urls/new", checkUserLoggedIn, (req, res) => {
  res.render("urls_new", { userEmail: res.locals.user ? res.locals.user.email : null });
});

// Show URLs page for the logged-in user
app.get("/urls", (req, res) => {
  const userID = req.session.user_id; 
  if (!userID) {
    return res.status(401).redirect("/login"); 
  }

  const userUrls = urlsForUser(userID, urlDatabase); 
  const templateVars = {
    urls: userUrls,
    userEmail: users[userID]?.email || null,
  };

  res.render("urls_index", templateVars); 
});

// Show login page
app.get("/login", (req, res) => {
  res.render("login", { userEmail: res.locals.user ? res.locals.user.email : null });
});

// Show registration page
app.get("/register", (req, res) => {
  res.render("register", { userEmail: res.locals.user ? res.locals.user.email : null });
});

// Register a new user
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (getUserByEmail(email, users)) {
    return res.status(400).send("Email already registered.");
  }

  const newUserId = generateRandomString();  
  const hashedPassword = hashPassword(password);  

  users[newUserId] = {
    id: newUserId,
    email: email,
    password: hashedPassword,
  };

  req.session.user_id = newUserId;  
  res.redirect("/urls");  
});

// Login route
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);

  if (!user || !comparePasswords(password, user.password)) {
    return res.status(403).send("Invalid email or password."); 
  }

  req.session.user_id = user.id; 
  res.redirect("/urls"); 
});

// Logout route
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// URL show route
app.get("/urls/:id", (req, res) => {
  const url = urlDatabase[req.params.id]; 
  const userId = req.session.user_id; 

  if (!url) {
    return res.status(404).send("URL not found");
  }

  if (url.userId !== userId) {
    return res.status(403).send("You do not have permission to view or edit this URL");
  }

  const templateVars = { 
    id: req.params.id, 
    longURL: url.longURL, 
    userEmail: res.locals.user ? res.locals.user.email : null 
  };
  res.render("urls_show", templateVars);
});

// URL edit route
app.post("/urls/:id", checkUserLoggedIn, (req, res) => {
  const { longURL } = req.body;

  const url = urlDatabase[req.params.id];  

  if (!url || url.userId !== req.session.user_id) {
    return res.status(403).send("You are not authorized to edit this URL.");
  }

  url.longURL = longURL;  
  res.redirect("/urls");  
});

// Add new URL (POST request)
app.post("/urls", (req, res) => {
  const userId = req.session.user_id; 

  if (!userId) {
    return res.status(401).send("You must be logged in to create URLs");
  }

  const shortURL = generateRandomString(); 
  const { longURL } = req.body; 

  urlDatabase[shortURL] = {
    longURL: longURL,
    userId: userId 
  };

  res.redirect(`/urls/${shortURL}`);
});

// DELETE URL route
app.post("/urls/:id/delete", checkUserLoggedIn, (req, res) => {
  const url = urlDatabase[req.params.id];  

  if (!url || url.userId !== req.session.user_id) {
    return res.status(403).send("You are not authorized to delete this URL.");
  }

  delete urlDatabase[req.params.id];  
  res.redirect("/urls");  
});

// Start the server
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`); 
});







