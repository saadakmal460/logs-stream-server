const { ingest } = require("../controllers/ingest.controller");

async function ingestRoutes(app) {
  app.post("/ingest", ingest);
}

module.exports = ingestRoutes;
