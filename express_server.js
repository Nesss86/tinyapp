const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "[email protected]",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "[email protected]",
    password: "dishwasher-funk",
  },
};

function generateRandomString() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters[randomIndex];
  }
  return randomString;
}

function getUserByEmail(email) {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null; 
}


app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");
app.use(express.static('public'));


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

app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const username = userId && users[userId] ? users[userId].email : null;  // Added safe check

  const templateVars = {
    username: username,
    urls: urlDatabase,
  };
  res.render("urls_index", templateVars); 
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];  // Get user_id from cookies
  if (!userId || !users[userId]) {  // Add a check for undefined user
    return res.redirect('/login');  // Redirect to login if no user_id cookie exists or user doesn't exist
  }

  const username = users[userId].email; // Safe to access now that we checked users[userId]

  const templateVars = { username: username };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];

  if (!longURL) {
    return res.status(404).send("URL not found.");
  }

  const userId = req.cookies["user_id"];
  console.log('User ID from cookie:', userId);

  // Check if the userId exists and if the user is in the users object
  const user = userId ? users[userId] : null;
  console.log('Retrieved user:', user);

  // If user is found, get email, otherwise set username to null
  const username = user ? user.email : null;

  const templateVars = { id, longURL, username };
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
  urls[id] = newLongURL;      
  res.redirect(`/urls/${id}`);
});

app.post('/login', (req, res) => {
  console.log(req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Email and password are required.");
  }

  const user = getUserByEmail(email);

  if (!user || user.password !== password) {
    return res.status(403).send("Invalid email or password.");
  }

  res.cookie('user_id', user.id);  // Only set user_id here

  console.log(req.cookies); // Log the cookies to check if 'user_id' is set
  res.redirect('/urls');
});


app.post('/logout', (req, res) => {
  res.clearCookie('username');  
  res.redirect('/urls');
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Email and password cannot be empty.");
  }
 
  if (getUserByEmail(email)) {
    return res.status(400).send("Email is already registered.");
  }
  
  const userID = generateRandomString();

  users[userID] = {
    id: userID,
    email: email,
    password: password,
  };

  console.log(users);

  res.cookie('user_id', userID);
  res.redirect("/urls");
});

app.get('/login', (req, res) => {
  res.render('login');
});