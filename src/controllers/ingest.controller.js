const { randomUUID } = require("crypto");
const producerService = require("../services/producer.service");
const liveLogsProducerService = require("../services/liveLogsProducer.service");

const NO_CORRELATION_ID = "no-correlation-id";

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

async function ingest(request, reply) {
  const body = request.body;
  assignCorrelationIds(body);
  const [result] = await Promise.all([
    producerService.sendLogs(body),
    liveLogsProducerService.publishLogs(body),
  ]);
  return reply.code(200).send(result);
}

module.exports = { ingest, assignCorrelationIds };
