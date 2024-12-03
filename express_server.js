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

function urlsForUser(id) {
  const userUrls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
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
app.use(cookieParser());
app.set("view engine", "ejs");
app.use(express.static('public'));


// Middleware to assign userEmail to res.locals
app.use((req, res, next) => {
  const userId = req.cookies["user_id"];
  res.locals.userEmail = userId ? users[userId]?.email : null;
  next();
});

const checkLogin = (req, res, next) => {
  const userId = req.cookies.user_id;
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
  const userId = req.cookies["user_id"];
  const shortURL = req.params.id;
  const urlEntry = urlDatabase[shortURL];

  // Check if user is logged in
  if (!userId || !users[userId]) {
    return res.status(401).send(`
      <html>
        <head><title>Unauthorized</title></head>
        <body>
          <h1>401 - Unauthorized</h1>
          <p>You must be logged in to view this page.</p>
          <a href="/login">Log in</a>
        </body>
      </html>
    `);
  }

  // Check if URL exists
  if (!urlEntry) {
    return res.status(404).send(`
      <html>
        <head><title>URL Not Found</title></head>
        <body>
          <h1>404 - URL Not Found</h1>
          <p>The URL you are trying to access does not exist.</p>
          <a href="/urls">Go back to your URLs</a>
        </body>
      </html>
    `);
  }

  // Check if URL belongs to the logged-in user
  if (urlEntry.userID !== userId) {
    return res.status(403).send(`
      <html>
        <head><title>Forbidden</title></head>
        <body>
          <h1>403 - Forbidden</h1>
          <p>You do not have permission to access this URL.</p>
          <a href="/urls">Go back to your URLs</a>
        </body>
      </html>
    `);
  }

  // Render the URL details page
  const templateVars = { id: shortURL, longURL: urlEntry.longURL, userEmail: users[userId].email };
  res.render("urls_show", templateVars);
});


app.post('/urls', (req, res) => {
  const userId = req.cookies.user_id;
  if (!userId || !users[userId]) {
    return res.status(401).send('<h1>Unauthorized</h1><p>You must log in to shorten URLs.</p>');
  }

  // Add new URL to the database
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = { longURL, userId }; // Save userId to associate URL with a user
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id; 
  const longURL = urlDatabase[shortURL]; 

  if (!longURL) {
    return res.status(404).send(`
      <html>
        <head><title>URL Not Found</title></head>
        <body>
          <h1>404 - URL Not Found</h1>
          <p>The short URL you are trying to access does not exist. Please check the URL and try again.</p>
          <a href="/urls">Go back to your URLs</a>
        </body>
      </html>
    `);
  }

  res.redirect(longURL);
});

app.post('/urls/:id/delete', (req, res) => {
  const shortURL = req.params.id;
  const userId = req.cookies.user_id;

  
  if (!userId || !users[userId]) {
    return res.status(401).send('You must be logged in to delete URLs.');
  }

  const urlEntry = urlDatabase[shortURL];

  
  if (!urlEntry) {
    return res.status(404).send('URL not found.');
  }

  
  if (urlEntry.userId !== userId) {
    return res.status(403).send('You do not have permission to delete this URL.');
  }

  
  delete urlDatabase[shortURL];
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

  if (!email || !password) {
    return res.status(400).send('Email and password cannot be empty!');
  }

  let foundUser;
  for (const userId in users) {
    if (users[userId].email === email) {
      foundUser = users[userId];
      break;
    }
  }

  if (!foundUser) {
    return res.status(403).send('Invalid email or password.');
  }

  let isPasswordCorrect;
  try {
    isPasswordCorrect = comparePasswords(password, foundUser.password); // Use helper function
  } catch (error) {
    return res.status(500).send('An error occurred while processing your request.');
  }

  if (!isPasswordCorrect) {
    return res.status(403).send('Invalid email or password.');
  }

  res.cookie('user_id', foundUser.id);
  res.redirect('/urls');
});


app.post("/logout", (req, res) => {
  res.clearCookie("user_id");  // Clear the user_id cookie
  res.redirect("/login");  // Redirect to login page
});

app.get('/register', (req, res) => {
  const userId = req.cookies.user_id;
  if (userId && users[userId]) {
    return res.redirect('/urls'); // Redirect if user is logged in
  }
  const userEmail = userId ? users[userId]?.email : null;
  res.render('register', { userEmail });
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email and password cannot be empty!');
  }

  for (const userId in users) {
    if (users[userId].email === email) {
      return res.status(400).send('Email already registered.');
    }
  }

  let hashedPassword;
  try {
    hashedPassword = hashPassword(password); // Use helper function
  } catch (error) {
    return res.status(500).send('An error occurred while processing your request.');
  }

  const userId = `user${Math.floor(Math.random() * 1000)}`;
  users[userId] = {
    id: userId,
    email,
    password: hashedPassword,
  };

  console.log(users);


  res.cookie('user_id', userId);
  res.redirect('/urls');
});


  



app.get('/login', (req, res) => {
  const userId = req.cookies.user_id;
  if (userId && users[userId]) {
    return res.redirect('/urls'); // Redirect if user is logged in
  }
  res.render('login');
});

