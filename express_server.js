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

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

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
  const username = userId ? users[userId].email : null;

  const templateVars = {
    username: username, 
    urls: urlDatabase,
  };
  res.render("urls_index", templateVars); 
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];

  if (!longURL) {
    return res.status(404).send("URL not found.");
  }

  const userId = req.cookies["user_id"];
  const username = userId ? users[userId].email: null;

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
  urlDatabase[id] = newLongURL;      
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const { username } = req.body;
  res.cookie('username', username);
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

  
  for (const userId in users) {
    if (users[userId].email === email) {
      
      return res.status(400).send("Email is already registered.");
    }
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