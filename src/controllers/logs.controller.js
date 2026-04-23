const clickhouse = require("../lib/clickhouse");

function toUInt(value, fallback, max) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  if (typeof max === "number") return Math.min(parsed, max);
  return parsed;
}

async function listLogs(request, reply) {
  const {
    project_name: projectName,
    correlation_id: correlationId,
    start,
    end,
    limit,
    offset,
  } = request.query || {};

  const conditions = [];
  const params = {};

  if (projectName) {
    conditions.push("projectId = {projectId:String}");
    params.projectId = projectName;
  }

  if (correlationId) {
    conditions.push("correlationId = {correlationId:String}");
    params.correlationId = correlationId;
  }

  if (start) {
    conditions.push("timestamp >= parseDateTime64BestEffort({start:String})");
    params.start = start;
  }

  if (end) {
    conditions.push("timestamp <= parseDateTime64BestEffort({end:String})");
    params.end = end;
  }

  const safeLimit = toUInt(limit, 100, 1000);
  const safeOffset = toUInt(offset, 0, undefined);

  params.limit = safeLimit;
  params.offset = safeOffset;

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT
      projectId AS project_name,
      '' AS environment,
      correlationId AS correlation_id,
      loggerName AS loggerName,
      sessionStartedAt AS started_at,
      sessionEndedAt AS ended_at,
      durationMs AS duration_ms,
      requestMethod AS request_method,
      requestPath AS request_path,
      statusCode AS request_status_code,
      timestamp AS log_timestamp,
      level AS log_level,
      message AS log_message,
      component AS log_component,
      meta AS log_meta
    FROM logging.logs
    ${whereClause}
    ORDER BY timestamp DESC
    LIMIT {limit:UInt32}
    OFFSET {offset:UInt32}
  `;

  const rows = await clickhouse.query({
    query,
    format: "JSONEachRow",
    query_params: params,
  });

  const data = await rows.json();
  return reply.code(200).send(data);
}

module.exports = { listLogs };
