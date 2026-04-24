const {
  listInitialLiveLogs,
  socketHandshakeInfo,
} = require("../controllers/liveLogs.controller");

async function liveLogsRoutes(app) {
  app.get("/live-logs", listInitialLiveLogs);
  app.get("/live-logs/socket", socketHandshakeInfo);
}

module.exports = liveLogsRoutes;
