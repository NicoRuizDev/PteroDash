const indexjs = require("../../index.js");
const arciotext = require("./arcio.js").text;
const adminjs = require("./admin.js");
const fs = require("fs");
const newsettings = require("../../settings.json");
const path = require("path");
const ejs = require("ejs");
const fetch = require("node-fetch");

module.exports.load = async function (app, db) {
  app.get("/api/nodes", async (req, res) => {
    const response = await fetch(
      newsettings.pterodactyl.domain + "/api/application/nodes",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${newsettings.pterodactyl.key}`,
        },
      }
    );
    const data = await response.json();

    // Sort the nodes by ID
    const sortedData = data.data.sort(
      (a, b) => a.attributes.id - b.attributes.id
    );

    // Add status for each node
    const nodesWithStatus = await Promise.all(
      sortedData.map(async (node) => {
        try {
          const healthResponse = await fetch(
            `https://${node.attributes.fqdn}:${node.attributes.daemon_listen}/health`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${newsettings.pterodactyl.key}`,
              },
            }
          );
          const healthData = await healthResponse.json();
          return {
            id: node.attributes.id,
            name: node.attributes.name,
            locationId: node.attributes.location_id,
            fqdn: node.attributes.fqdn,
            memory: node.attributes.memory,
            disk: node.attributes.disk,
            status: healthData.status === "healthy" ? "NO" : "YES",
          };
        } catch (err) {}
      })
    );

    // Render the EJS view and pass the sortedNodes data as a variable
    res.send({ nodes: nodesWithStatus });
  });
};
