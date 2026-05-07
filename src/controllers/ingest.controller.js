const { randomUUID } = require("crypto");
const producerService = require("../services/producer.service");
const liveLogsProducerService = require("../services/liveLogsProducer.service");
const apiTokenService = require("../services/apiToken.service");

const NO_CORRELATION_ID = "no-correlation-id";

function normalizeBody(body) {
  if (body && !Array.isArray(body) && Array.isArray(body.payloads)) {
    return body.payloads.map((p) => ({ type: "session", data: p }));
  }
  return body;
}

function assignCorrelationIds(body) {
  if (!Array.isArray(body)) return;

  for (const entry of body) {
    const data = entry && entry.data;
    if (!data) continue;

    if (data.correlationId === NO_CORRELATION_ID || !data.correlationId) {
      data.correlationId = randomUUID();
    }
  }
}

function assignProjectId(body, projectId) {
  if (!Array.isArray(body)) return;

  for (const entry of body) {
    const data = entry && entry.data;
    if (!data) continue;

    data.projectId = projectId;

    if (Array.isArray(data.logs)) {
      for (const log of data.logs) {
        if (log) log.projectId = projectId;
      }
    }
  }
}

async function ingest(request, reply) {
  console.log("Received ingest request with body");
  const projectId = await apiTokenService.resolveProjectId(
    request.headers.authorization
  );
  if (!projectId) {
    console.log("Invalid or missing API token");
    return reply.code(401).send({ error: "Invalid or missing API token" });
  }

  const body = normalizeBody(request.body);
  assignCorrelationIds(body);
  assignProjectId(body, projectId);

  const [result] = await Promise.all([
    producerService.sendLogs(body),
    liveLogsProducerService.publishLogs(body),
  ]);
  return reply.code(200).send(result);
}

module.exports = { ingest, assignCorrelationIds, assignProjectId, normalizeBody };
