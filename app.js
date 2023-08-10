const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const databasePath = path.join(__dirname, "userData.db");
const app = express();
app.use(express.json());
const bcrypt = require("bcrypt");
const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();
app.post("/register", async (request, response) => {
  let { username, name, password, gender, location } = request.body;
  let hashedpassword = await bcrypt.hash(password, 10);
  let query1 = `select * from user where username='${username}';`;

  let dbuser = await database.get(query1);
  if (dbuser === undefined) {
    let newquery = `Insert into user (username,name,password,gender,location) 
      values ('${username}','${name}','${hashedpassword}','${gender}','${location}')`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      await database.run(newquery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const loginquery = `select * from user where username='${username}';`;
  const dbuser = await database.get(loginquery);
  if (dbuser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const ispassmatched = await bcrypt.compare(password, dbuser.password);
    if (ispassmatched === true) {
      response.send("Login successful");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const loginquery = `select * from user where username='${username}';`;
  const dbuser = await database.get(loginquery);
  const ispassmatched = await bcrypt.compare(oldPassword, dbuser.password);
  if (ispassmatched !== true) {
    response.status(400);
    response.send("Invalid current Password");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let hashedpassword = await bcrypt.hash(newPassword, 10);
      let query1 = `update user set password='${hashedpassword}' where username='${username}';`;
      await database.run(query1);
      response.send("Password Updated");
    }
  }
});
module.exports = app;
