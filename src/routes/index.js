const ingestRoutes = require("./ingest.routes");
const liveLogsRoutes = require("./liveLogs.routes");
const logsRoutes = require("./logs.routes");

async function registerRoutes(app) {
  app.get("/", async (request, reply) => {
    return reply
      .code(200)
      .send({ status: "ok", message: "LogiScout streaming server is running" });
  });

  app.register(ingestRoutes);
  app.register(liveLogsRoutes);
  app.register(logsRoutes);
}

module.exports = registerRoutes;
