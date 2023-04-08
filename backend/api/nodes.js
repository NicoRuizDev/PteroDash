const indexjs = require("../../index.js");
const adminjs = require("./admin.js");
const fs = require("fs");
const newsettings = require("../../settings.json");
const path = require("path");
const ejs = require("ejs");
const cache = require("memory-cache");
const fetch = require("node-fetch");

module.exports.load = async function (app, db) {
  app.get("/api/nodes", async (req, res) => {
    const cacheKey = "nodes";
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

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
          const healthResponse = await Promise.race([
            fetch(
              `https://${node.attributes.fqdn}:${node.attributes.daemon_listen}/health`,
              {
                method: "GET",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${newsettings.pterodactyl.key}`,
                },
              }
            ),
            new Promise((_, reject) => {
              setTimeout(() => reject(new Error("Timeout")), 1000);
            }),
          ]);
          const healthData = await healthResponse.json();
          return {
            name: node.attributes.name,
            locationId: node.attributes.location_id,
            fqdn: node.attributes.fqdn,
            memory: node.attributes.memory,
            disk: node.attributes.disk,
            status: healthData.status === "healthy" ? "NO" : "YES",
          };
        } catch (err) {
          return {
            name: node.attributes.name,
            locationId: node.attributes.location_id,
            fqdn: node.attributes.fqdn,
            memory: node.attributes.memory,
            disk: node.attributes.disk,
            status: "NO",
          };
        }
      })
    );

    // Cache the response for 5 minutes
    cache.put(cacheKey, { nodes: nodesWithStatus }, 60 * 60 * 1000);

    return res.json({ nodes: nodesWithStatus });
  });
};
