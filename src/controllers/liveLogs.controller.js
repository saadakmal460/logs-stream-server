const clickhouse = require("../lib/clickhouse");
const { formatLiveLogs } = require("../utils/liveLogsFormatter");

const MAX_INITIAL_LOGS = 100;

async function listInitialLiveLogs(request, reply) {
  const { projectId } = request.query || {};

  if (!projectId) {
    return reply.code(400).send({ message: "projectId is required" });
  }

  const rows = await clickhouse.query({
    query: `
      SELECT
        projectId,
        correlationId,
        timestamp,
        level,
        loggerName,
        message,
        meta,
        requestMethod,
        requestPath,
        statusCode
      FROM logging.logs
      WHERE projectId = {projectId:String}
      ORDER BY timestamp DESC
      LIMIT {limit:UInt32}
    `,
    format: "JSONEachRow",
    query_params: {
      projectId: String(projectId),
      limit: MAX_INITIAL_LOGS,
    },
  });

  const data = await rows.json();
  return reply.code(200).send(formatLiveLogs(data));
}

async function socketHandshakeInfo(request, reply) {
  const { projectId } = request.query || {};

  if (!projectId) {
    return reply.code(400).send({ message: "projectId is required" });
  }

  return reply.code(426).send({
    message: "Open a WebSocket connection on /live-logs/socket?projectId=<value>.",
  });
}

module.exports = {
  listInitialLiveLogs,
  socketHandshakeInfo,
};
