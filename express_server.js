// express_server.js
// This file sets up and runs the Express web server for the TinyApp project.
// It handles user authentication, URL shortening, and management of user-specific URLs. 
// Users can register, log in, and manage their personalized short URLs. 
// The app uses sessions to track user login state, bcrypt for password security, 
// and EJS for rendering dynamic views.

const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const {
  getUserByEmail,
  getUserById,
  urlsForUser,
  hashPassword,
  comparePasswords,
  generateRandomString,
  users,
  urlDatabase  // I used this to manage the URLs associated with users
} = require("./helpers");

const app = express();
const PORT = 8080;

// Set the view engine to EJS for rendering dynamic views
app.set("view engine", "ejs");

// I added body parser middleware to handle form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Use a static directory for serving images and other assets
app.use(express.static('public'));

// I set up session configuration to track user login state
app.use(
  session({
    secret: "a secret key",  // In production, I'd replace this with a proper secret key
    resave: false,
    saveUninitialized: true,
  })
);

// Middleware to check if user is logged in
const checkUserLoggedIn = (req, res, next) => {
  if (!req.session.user_id) {
    return res.redirect("/login");  // I used this to ensure only logged-in users can access certain routes
  }
  next();
};

// Middleware to attach user info to the response object
const setUserInfo = (req, res, next) => {
  if (req.session.user_id) {
    const user = getUserById(req.session.user_id, users);  // I used this to fetch user data from the database
    res.locals.user = user || null;  // If user isn't found, set to null
  } else {
    res.locals.user = null;
  }
  next();
};

// Use the middleware to ensure user data is available for every request
app.use(setUserInfo);

// Routes

// Home page route
app.get("/", (req, res) => {
  // Render the homepage, passing the userEmail if logged in
  res.render("home", { userEmail: res.locals.user ? res.locals.user.email : null });
});

// Show the "Create New URL" page
app.get("/urls/new", checkUserLoggedIn, (req, res) => {
  res.render("urls_new", { userEmail: res.locals.user ? res.locals.user.email : null });
});

// Show URLs page for the logged-in user
app.get("/urls", checkUserLoggedIn, (req, res) => {
  const userId = req.session.user_id;  // I retrieved the user ID from the session to personalize the URL list
  console.log("User ID in session:", userId);  // I used this log to verify that the session is being tracked properly

  if (!userId) {
    return res.redirect("/login");  // I added this check to redirect users who aren't logged in
  }

  const userUrls = urlsForUser(userId, urlDatabase);  // I used this function to retrieve URLs associated with the logged-in user
  console.log("User's URLs:", userUrls);  // I logged the URLs for debugging purposes

  res.render("urls_index", {
    userEmail: res.locals.user ? res.locals.user.email : null,
    urls: userUrls
  });
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

  // I did this to check if the email is already registered in the system
  if (getUserByEmail(email, users)) {
    return res.status(400).send("Email already registered.");
  }

  const newUserId = generateRandomString();  // I generated a new random user ID
  const hashedPassword = hashPassword(password);  // I hashed the password to store it securely

  // I added the new user to the users object
  users[newUserId] = {
    id: newUserId,
    email: email,
    password: hashedPassword,
  };

  req.session.user_id = newUserId;  // I set the session for the newly registered user

  res.redirect("/urls");  // I redirected the user to their URLs page after successful registration
});

// Login route
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = getUserByEmail(email, users);  // I retrieved the user by email from the database

  // I used this to validate the credentials, checking if the email exists and if the password is correct
  if (!user || !comparePasswords(password, user.password)) {
    return res.status(403).send("Invalid email or password.");
  }

  req.session.user_id = user.id;  // I set the session ID after a successful login
  console.log("Logged in user ID:", req.session.user_id);  // I logged the session ID for debugging purposes

  res.redirect("/urls");  // I redirected the user to their URLs page after logging in
});

// Logout route
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {  // I used this to destroy the session when the user logs out
    if (err) {
      return res.status(500).send("Error logging out.");  // I handled potential errors during logout
    }
    res.redirect("/");  // Redirecting to the homepage instead of the login page now
  });
});

// URL show route
app.get("/urls/:id", checkUserLoggedIn, (req, res) => {
  const url = urlDatabase[req.params.id];  // I retrieved the URL by its short ID

  // I did this to check if the URL exists and handle errors when it's not found
  if (!url) {
    return res.status(404).send("URL not found");
  }

  res.render("urls_show", { 
    id: req.params.id, 
    longURL: url.longURL,
    userEmail: res.locals.user ? res.locals.user.email : null 
  });
});

// URL edit route
app.post("/urls/:id", checkUserLoggedIn, (req, res) => {
  const { longURL } = req.body;

  const url = urlDatabase[req.params.id];  // I retrieved the URL from the database

  // I did this to check if the user is authorized to edit the URL
  if (!url || url.userId !== req.session.user_id) {
    return res.status(403).send("You are not authorized to edit this URL.");
  }

  url.longURL = longURL;  // I updated the long URL associated with the short URL

  res.redirect("/urls");  // I redirected the user to their URL list after updating the URL
});

// Add new URL (POST request)
app.post("/urls", checkUserLoggedIn, (req, res) => {
  const shortURL = generateRandomString();  // I generated a new short URL
  const { longURL } = req.body;  // I retrieved the long URL from the user's input

  // I added the new URL to the database and associated it with the logged-in user
  urlDatabase[shortURL] = {
    longURL: longURL,
    userId: req.session.user_id  // I associated the URL with the logged-in user's ID
  };

  res.redirect("/urls");  // I redirected the user to their URL list after adding the new URL
});

// DELETE URL route (Add this)
app.post("/urls/:id/delete", checkUserLoggedIn, (req, res) => {
  const url = urlDatabase[req.params.id];  // I retrieved the URL by its short ID

  // I did this to check if the URL exists and ensure the user is authorized to delete it
  if (!url || url.userId !== req.session.user_id) {
    return res.status(403).send("You are not authorized to delete this URL.");
  }

  delete urlDatabase[req.params.id];  // I deleted the URL from the database

  res.redirect("/urls");  // I redirected the user to the URLs page after deletion
});

// Start the server
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);  // I logged the port to confirm the server is running
});






