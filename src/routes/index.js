const ingestRoutes = require("./ingest.routes");

async function registerRoutes(app) {
  app.register(ingestRoutes);
}

module.exports = registerRoutes;
