const ingestRoutes = require("./ingest.routes");
const logsRoutes = require("./logs.routes");

async function registerRoutes(app) {
  app.register(ingestRoutes);
  app.register(logsRoutes);
}

module.exports = registerRoutes;
