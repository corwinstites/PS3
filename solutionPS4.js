// this uses /login to authorize a use

var express = require("express");
var app = express();
const fetch = require("node-fetch");
var bodyParser = require("body-parser");
// body parser extracts the entire body portion of an incoming request stream and exposes it on req.body
// the middleware was a part of Express.js earlier but now you have to install it separately.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({}));
const port = 3001;
// authenticate is a middleware function that checks for a secret token in the url
// if the token is present, it calls next() to call the next route
// if the token is not present, it sends a 401 error
const authenticate = (req, res, next) => {
  const url = req.url;
  if (url) {
    let path = url.split("=");
    // not so secrt token is in the url
    ////////////////////////////////
    if (path[1] == "secret-token") { // If they have the admin secret token set req.user to admin.
      req.user = "admin";
      next();
    }
    if (path[1] == "not-secret-token") { // If they have the non-admin secret token do nothing to req.user.
      next();
    }
    ////////////////////////////////
  } else {
    res.sendStatus(401);
  }
};
// store contacts in an arrays
// role is a property of each contact that is either "reader" or "editor"
// reader can only read contacts
// editor can read and write contacts
var contacts = [
  {
    name: "peter parker",
    age: 21,
    email: "peter@mit.edu",
    role: "none",
    password: "test1"
  },
  {
    name: "bruce wayne",
    age: 32,
    email: "bruce@mit.edu",
    role: "none",
    password: "test2"
  },
  {
    name: "diana prince",
    age: 25,
    email: "diana@mit.edu",
    role: "admin",
    password: "test3"
  },
];
// app.get("/", function (req, res) {
app.get("/", function (req, res) {
  res.send(`<h1> Routes: Try http://localhost:${port}/login </h1>`);
});
// login form with a post request to /auth  and a get request to /login
app.get("/login", (req, res) => {
  // send back a login form
  let form = `<form action="/auth" method="post">
    <label for="name">Enter name: </label>
    <input id="name" type="text" name="name" value="name">
    <input id="password" type="text" name="password" value="password">
    <input type="submit" value="OK">
    </form>`;
  res.send(form);
});

////////////////////////////////
function checkUser(name, password) { // This function returns 1 for an admin, 2 for an approved user, and 0 for an unapproved user.
  for (let i = 0; i < contacts.length; i++) {
    var check = 0
    if (contacts[i].name == name && contacts[i].password == password && contacts[i].role == "admin"){ // User is an admin. Return 1.
      return 1 
      check = 1
    }
    if (contacts[i].name == name && contacts[i].password == password && contacts[i].role != "admin"){ // User is in the contact list but is not an admin. Return 2.
      return 2 
      check = 1
    }
  }
  if (check == 0){ // User is not in the contact list. Return zero.
    return 0 
  }  
}
////////////////////////////////

app.post("/auth", (req, res) => {
  let {name, password} = req.body;
  ////////////////////////////////
  result = checkUser(name, password) // Run the function with the present credentials to see who's trying to login.
  console.log(result)
  if (result == 1){ // Our result shows an admin is loging in. Give them the token to see contacts.
    console.log('Here1')
    let form = `<form action="/contacts" method="get">
    <label for="name">Get Contacts </label>
    <input id="token" type="hidden" name="token" value="secret-token">
    <input type="submit" value="OK">
    </form>`;
    res.send(form);
  }
  if (result == 2){ // Our result shows an approved user who is not an admin is loging in. Let them in but give them the token that doesn't allow them to see contacts.
    console.log('Here2')
    let form = `<form action="/contacts" method="get">
    <label for="name">Get Contacts </label>
    <input id="token" type="hidden" name="token" value="not-secret-token">
    <input type="submit" value="OK">
    </form>`;
    res.send(form);
  }
  if (result == 0){ // Our result shows an unapproved user is trying to log in. Give them an error message and send them back to the login screen.
    console.log('Here3')
    let form = `<p> Incorrect Username or Password <p> <form action="/auth" method="post">
    <label for="name">Enter name: </label>
    <input id="name" type="text" name="name" value="name">
    <input id="password" type="text" name="password" value="password">
    <input type="submit" value="OK">
    </form>`;
    res.send(form);
  }
  ////////////////////////////////
});

//athenticate is used to check if the  secret token is correct
app.get("/contacts", authenticate, (req, res) => {
  //authenticate adds user=admin to the request object if the token is correct
  // we can use this to check if the user is an admin
  if(req.user == "admin") {
    res.json(contacts);
  } else {
    res.sendStatus(401);
  }
});

// add authentication to the post request to /contact to allow only users with role = admin to add a contact
app.post("/contact", (req, res) => {
  // add a contact
  let contact = req.body;
  contacts.push(contact);
  res.redirect("/contacts/" + req.body.name);
});

app.listen(port, ()=> {console.log(`Running on port: ${port}`);});
