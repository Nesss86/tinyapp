const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080; // Default port 8080

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

// Helper function to generate random string
function generateRandomString() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters[randomIndex];
  }
  return randomString;
}

// Helper function to get user by email
function getUserByEmail(email) {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
}

// Helper function to get user by ID
function getUserById(id) {
  return users[id] || null; // Returns user if found, otherwise null
}

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");
app.use(express.static('public'));

// Middleware to assign userEmail to res.locals
app.use((req, res, next) => {
  const userId = req.cookies["user_id"];
  res.locals.userEmail = userId ? users[userId]?.email : null;
  next();
});

// URL database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get('/urls', (req, res) => {
  const userId = req.cookies.user_id;  // Retrieve user_id from cookie
  const user = getUserById(userId);  // Use user_id to get user data
  if (!user) {
    return res.status(401).send("Please log in to view URLs.");
  }

  const urls = {}; // Placeholder, customize as needed
  res.render('urls_index', { urls: urls });
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];  // Get user_id from cookies
  if (!userId || !users[userId]) {  // Check for user_id cookie and user
    return res.redirect('/login');  // Redirect to login if no user_id exists
  }

  const templateVars = { userEmail: users[userId].email };  // Pass userEmail automatically
  res.render("urls_new", templateVars);  // Render the newURL view with userEmail
});

app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const urlEntry = urlDatabase[id];

  if (!urlEntry) {
    return res.status(404).send("URL not found.");
  }

  const userId = req.cookies["user_id"];
  if (!userId || !users[userId]) {
    return res.status(401).send("You must be logged in to view this URL.");
  }

  const templateVars = { id, longURL: urlEntry, userEmail: res.locals.userEmail };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString(); 
  const longURL = req.body.longURL; 
  urlDatabase[shortURL] = longURL; 
  res.redirect(`/urls/${shortURL}`);
});  

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id; 
  const longURL = urlDatabase[shortURL]; 

  if (!longURL) {
    return res.status(404).send("URL not found.");
  }

  res.redirect(longURL);
});

app.post('/urls/:id/delete', (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id]; 
  res.redirect('/urls');
});

app.post('/urls/:id', (req, res) => {
  const id = req.params.id;          
  const newLongURL = req.body.longURL; 
  urlDatabase[id] = newLongURL;      
  res.redirect(`/urls/${id}`);
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Find the user by email
  let foundUser = null;
  for (const userId in users) {
    if (users[userId].email === email) {
      foundUser = users[userId];
      break;
    }
  }

  // If user is not found or password is incorrect, send error
  if (!foundUser || !bcrypt.compareSync(password, foundUser.password)) {
    return res.status(403).send('Invalid email or password.');
  }

  // Log the user in by setting a cookie
  res.cookie('user_id', foundUser.id);
  res.redirect('/urls');
});


app.post("/logout", (req, res) => {
  res.clearCookie("user_id");  // Clear the user_id cookie
  res.redirect("/login");  // Redirect to login page
});

app.get('/register', (req, res) => {
  const userId = req.cookies.user_id;  // Retrieve user_id from cookie
  const userEmail = userId ? users[userId]?.email : '';  // Get the user's email from users database if user_id exists
  res.render('register', { userEmail: userEmail });
});

const bcrypt = require('bcryptjs'); // Add bcryptjs for password hashing

app.post('/register', (req, res) => {
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return res.status(400).send('Email and password cannot be empty!');
  }

  // Check if the email already exists
  for (const userId in users) {
    if (users[userId].email === email) {
      return res.status(400).send('Email already registered.');
    }
  }

  // Generate a random user ID
  const userId = `user${Math.floor(Math.random() * 1000)}`;

  // Hash the password
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Add the user to the database
  users[userId] = {
    id: userId,
    email,
    password: hashedPassword,
  };

  // Log the user in by setting a cookie
  res.cookie('user_id', userId);
  res.redirect('/urls');
});


app.get("/login", (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.error("Error rendering login page:", error);
    res.status(500).send("Internal Server Error");
  }
});
