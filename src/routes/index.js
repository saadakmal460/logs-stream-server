const ingestRoutes = require("./ingest.routes");
const liveLogsRoutes = require("./liveLogs.routes");
const logsRoutes = require("./logs.routes");

async function registerRoutes(app) {
  app.register(ingestRoutes);
  app.register(liveLogsRoutes);
  app.register(logsRoutes);
}

module.exports = registerRoutes;
