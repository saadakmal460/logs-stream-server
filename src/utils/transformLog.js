/**
 * Transforms a raw ingest payload item into flat Kafka message values.
 */
function transformLog(item, log) {
  return {
    projectId: "1",
    correlationId: item.correlationId || null,
    timestamp: log.timestamp,
    level: log.level,
    message: log.message,
    loggerName: log.loggerName,
    meta: log.meta || {},
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
 * Builds Kafka messages from a batch of ingest items.
 */
function buildMessages(body) {
  const messages = [];

  for (const item of body) {
    const data = item.data;
    
    if (item.type == "session") {
      for (const log of data.logs) {
        messages.push({ value: JSON.stringify(transformLog(data, log)) });
      }
    } else {
      messages.push({ value: JSON.stringify(transformLog(data, data)) });
    }
  }

  return messages;
}

module.exports = { transformLog, buildMessages };
