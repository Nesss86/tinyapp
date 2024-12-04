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
  urlDatabase  // Import urlDatabase
} = require("./helpers");

const app = express();
const PORT = 8080;

// Set the view engine to EJS
app.set("view engine", "ejs");

// Body parser for form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(
  session({
    secret: "a secret key",  // It's good practice to use an actual secret key in production
    resave: false,
    saveUninitialized: true,
  })
);

// Middleware to check if user is logged in
const checkUserLoggedIn = (req, res, next) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  next();
};

// Middleware to attach user info to the response object
const setUserInfo = (req, res, next) => {
  if (req.session.user_id) {
    res.locals.user = getUserById(req.session.user_id);  // Add user info to response locals
  }
  next();
};

// Use the middleware
app.use(setUserInfo);

// Routes

// Home page route
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// Show the "Create New URL" page
app.get("/urls/new", checkUserLoggedIn, (req, res) => {
  res.render("urls_new", { userEmail: res.locals.user.email });
});


// Show URLs page
app.get("/urls", checkUserLoggedIn, (req, res) => {
  const userUrls = urlsForUser(req.session.user_id);  // Get URLs using helper function
  res.render("urls_index", {
    userEmail: res.locals.user.email, // Get email using the user info stored in locals
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

  // Check if email is already registered
  if (getUserByEmail(email)) {
    return res.status(400).send("Email already registered.");
  }

  // Generate a new user ID
  const newUserId = generateRandomString();

  // Hash the password before saving
  const hashedPassword = hashPassword(password);

  // Add new user to the users object
  users[newUserId] = {
    id: newUserId,
    email: email,
    password: hashedPassword,
  };

  // Set the session for the logged-in user
  req.session.user_id = newUserId;

  // Redirect to URLs page
  res.redirect("/urls");
});

// Login route
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = getUserByEmail(email);

  // If no user found or invalid password, send error
  if (!user || !comparePasswords(password, user.password)) {
    return res.status(403).send("Invalid email or password.");
  }

  // Set the session with the user ID
  req.session.user_id = user.id;

  // Redirect to the URLs page after successful login
  res.redirect("/urls");
});

// Logout route
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error logging out.");
    }
    res.redirect("/login");
  });
});

// URL show route
app.get("/urls/:id", checkUserLoggedIn, (req, res) => {
  const url = urlDatabase[req.params.id]; // Retrieve URL from the database
  if (!url) {
    return res.status(404).send("URL not found");
  }

  res.render("urls_show", { id: req.params.id, longURL: url.longURL });
});

// URL edit route
app.post("/urls/:id", checkUserLoggedIn, (req, res) => {
  const { longURL } = req.body;

  const url = urlDatabase[req.params.id]; // Retrieve the URL from the database
  if (!url || url.userId !== req.session.user_id) {
    return res.status(403).send("You are not authorized to edit this URL.");
  }

  // Update URL in the database
  url.longURL = longURL;

  res.redirect("/urls");
});

// Add new URL (POST request)
app.post("/urls", checkUserLoggedIn, (req, res) => {
  const shortURL = generateRandomString(); // Generate new short URL
  const { longURL } = req.body; // Get the long URL from the form

  // Add the new URL to the database
  urlDatabase[shortURL] = {
    longURL: longURL,
    userId: req.session.user_id
  };

  res.redirect("/urls");  // Redirect to URLs page after adding new URL
});

// Start the server
app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});

