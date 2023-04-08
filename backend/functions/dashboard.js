const Database = require("better-sqlite3");

const db = new Database("backend/database/dashboard.db");

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT
    )
  `);

function addUser(username, password) {
  let user = addUserPrefix(username);
  const existingUser = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(user);

  if (existingUser) {
    const statement = db.prepare(
      "UPDATE users SET password = ? WHERE username = ?"
    );
    statement.run(password, user);
  } else {
    const statement = db.prepare(
      "INSERT INTO users (username, password) VALUES (?, ?)"
    );
    statement.run(user, password);
  }
}

function getUserByUsername(username) {
  let user = addUserPrefix(username);
  const statement = db.prepare("SELECT * FROM users WHERE username = ?");
  const result = statement.get(user);
  return result;
}

function updateUserPassword(username, newPassword) {
  let user = addUserPrefix(username);
  const statement = db.prepare(
    "UPDATE users SET password = ? WHERE username = ?"
  );
  statement.run(newPassword, user);
}

function deleteUserByUsername(username) {
  let user = addUserPrefix(username);
  const statement = db.prepare("DELETE FROM users WHERE username = ?");
  statement.run(user);
}

function addUserPrefix(str) {
  return "user-" + str;
}

function removeUserPrefix(str) {
  return str.replace("user-", "");
}

module.exports = {
  addUser,
  getUserByUsername,
  updateUserPassword,
  deleteUserByUsername,
};
