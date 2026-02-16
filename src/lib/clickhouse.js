const { createClient } = require("@clickhouse/client");
const config = require("../config");

const clickhouse = createClient({
  url: config.clickhouse.url,
  username: config.clickhouse.username,
  password: config.clickhouse.password,
});

module.exports = clickhouse;
