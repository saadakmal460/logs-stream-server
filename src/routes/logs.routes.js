const { listLogs } = require("../controllers/logs.controller");

async function logsRoutes(app) {
  app.get("/logs", listLogs);
}

module.exports = logsRoutes;
