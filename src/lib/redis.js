const { createClient } = require("redis");
const config = require("../config");

let client = null;

async function connect() {
  client = createClient({ url: config.redis.url });
  client.on("error", (err) => console.error("Redis error:", err));
  await client.connect();
  console.log("Redis connected");
  return client;
}

async function disconnect() {
  if (client) {
    await client.quit();
    client = null;
  }
}

function getClient() {
  return client;
}

module.exports = { connect, disconnect, getClient };
