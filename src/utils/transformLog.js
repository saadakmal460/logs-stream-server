/**
 * Transforms a raw ingest payload item into flat Kafka message values.
 */
function transformLog(item, log) {
  return {
    projectId: String(log.projectId || item.projectId || "1"),
    correlationId: item.correlationId || log.correlationId || null,
    timestamp: log.timestamp || new Date().toISOString(),
    level: log.level || "info",
    message: log.message || "",
    loggerName: log.loggerName || log.component || log.service || null,
    meta: log.meta || log.metadata || {},
    exception: log.exception || {},
    sessionStartedAt: item.startedAt || null,
    sessionEndedAt: item.endedAt || null,
    durationMs: item.durationMs || null,
    requestMethod: (item.request && item.request.method) || null,
    requestPath: (item.request && item.request.path) || null,
    statusCode: (item.request && item.request.statusCode) || null,
  };
}

/**
 * Builds normalized log rows from a batch of ingest items.
 */
function buildLogRecords(body) {
  const records = [];
  const items = Array.isArray(body) ? body : [];

  for (const item of items) {
    const data = item && item.data;
    if (!data) continue;

    if (item.type == "session") {
      for (const log of data.logs || []) {
        records.push(transformLog(data, log));
      }
    } else {
      records.push(transformLog(data, data));
    }
  }

  return records;
}

/**
 * Builds Kafka messages from a batch of ingest items.
 */
function buildMessages(body) {
  return buildLogRecords(body).map((record) => ({
    value: JSON.stringify(record),
  }));
}

module.exports = { transformLog, buildLogRecords, buildMessages };
