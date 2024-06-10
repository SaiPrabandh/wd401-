const express = require("express");
const firebaseAdmin = require('firebase-admin');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const fetch = require('node-fetch');

const app = express();
const saltRounds = 10;

const serviceAccount = require('./key.json');

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount)
});

const db = firebaseAdmin.firestore();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", function (req, res) {
  res.redirect("/signup");
});

app.get("/signup", function (req, res) {
  res.render("signup");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/dashboard", function (req, res) {
  res.render("dashboard");
});

app.get("/logout", function (req, res) {
  res.redirect("/login");
});

app.post("/signupSubmit", async function (req, res) {
  const { email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    await db.collection("users").add({ email, password: hash });
    res.send("Sign up is successful. Go to <a href='/login'>login</a>.");
  } catch (error) {
    console.error("Error signing up:", error);
    res.status(500).send("Error: Unable to sign up. Please try again later.");
  }
});

app.post("/loginSubmit", async function (req, res) {
  const { email, password } = req.body;
  try {
    const snapshot = await db.collection("users").where("email", "==", email).get();
    if (snapshot.empty) {
      return res.send("User not found.");
    }
    const user = snapshot.docs[0].data();
    const result = await bcrypt.compare(password, user.password);
    if (result) {
      res.render("dashboard");
    } else {
      res.send("Incorrect password.");
    }
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).send("Error: Unable to login. Please try again later.");
  }
});

app.get("/api/stock/search", async (req, res) => {
  const { symbol } = req.query;
  const apiKey = 'Z2WFRQXMGV52YU38';
  const apiUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
  
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    res.status(500).send('Error fetching stock data');
  }
});

app.listen(3000, () => {
  console.log("Listening at http://localhost:3000");
});
