const producerService = require("../services/producer.service");

async function ingest(request, reply) {
  const body = request.body;
  const result = await producerService.sendLogs(body);
  return reply.code(200).send(result);
}

module.exports = { ingest };
