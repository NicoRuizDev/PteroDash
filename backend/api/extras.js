const settings = require("../../settings.json");
const fs = require("fs");

const indexjs = require("../../index.js");
const fetch = require("node-fetch");
const cooldowns = new Map();
const { updateUserPassword } = require("../functions/dashboard");

module.exports.load = async function (app, db) {
  app.get("/panel", async (req, res) => {
    res.redirect(settings.pterodactyl.domain);
  });
  app.post("/change-password", async (req, res) => {
    // Make sure the user is authenticated
    if (!req.session.pterodactyl) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Load the settings file
    let newsettings = JSON.parse(fs.readFileSync("./settings.json"));

    // Check if the password change feature is enabled
    if (newsettings.api.client.allow.regen !== true) {
      return res
        .status(200)
        .json({ message: "Password changes are not currently allowed." });
    }

    // Extract the password fields from the form data
    const { newPassword, newPasswordConfirmation } = req.body;

    // Verify that the passwords match
    if (newPassword !== newPasswordConfirmation) {
      return res.status(200).json({ message: "Passwords do not match" });
    }

    // Check if the user is in cooldown
    const cooldownDuration = (1 / 2) * 60 * 1000; // 5 minutes
    const cooldownKey = req.session.pterodactyl.id;
    const cooldownExpiresAt = cooldowns.get(cooldownKey);
    if (cooldownExpiresAt && new Date() < new Date(cooldownExpiresAt)) {
      const cooldownRemaining =
        Math.floor((new Date(cooldownExpiresAt) - new Date()) / 1000) + 1;
      return res.status(200).json({
        message: `You can change your password in ${cooldownRemaining} seconds.`,
      });
    }

    // Update the user's password on the Pterodactyl API
    await fetch(
      `${settings.pterodactyl.domain}/api/application/users/${req.session.pterodactyl.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.pterodactyl.key}`,
        },
        body: JSON.stringify({
          username: req.session.pterodactyl.username,
          email: req.session.pterodactyl.email,
          first_name: req.session.pterodactyl.first_name,
          last_name: req.session.pterodactyl.last_name,
          password: newPassword,
        }),
      }
    );

    cooldowns.set(
      cooldownKey,
      new Date(Date.now() + cooldownDuration).toISOString()
    );
    setTimeout(() => {
      cooldowns.delete(cooldownKey);
    }, cooldownDuration);

    updateUserPassword(req.session.pterodactyl.username, newPassword);

    // Send a success response
    res.json({ message: "Password changed successfully" });
  });
};

function makeid(length) {
  let result = "";
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
