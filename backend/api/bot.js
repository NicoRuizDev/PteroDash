module.exports.load = async function (app, db) {
  require("../functions/bot.js").load(app, db);
};
