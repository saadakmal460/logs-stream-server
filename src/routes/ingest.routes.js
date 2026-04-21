const { ingest } = require("../controllers/ingest.controller");
const authenticate = require("../middleware/authenticate");

async function ingestRoutes(app) {
  app.post("/ingest", { preHandler: authenticate }, ingest);
}

module.exports = ingestRoutes;
