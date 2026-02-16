const kafka = require("../lib/kafka");
const clickhouse = require("../lib/clickhouse");
const config = require("../config");

let consumer = null;

async function testClickhouseConnection() {
  const rows = await clickhouse.query({ query: "SELECT 1", format: "JSONEachRow" });
  const result = await rows.json();
  console.log("ClickHouse connected. Result:", result);
}

async function processMessage({ message }) {
  const log = JSON.parse(message.value.toString());

  log.meta = JSON.stringify(log.meta ?? {});
  log.exception = JSON.stringify(log.exception ?? {});
  // log.timestamp = new Date(log.timestamp).toISOString();

  // if (log.sessionStartedAt)
  //   log.sessionStartedAt = new Date(log.sessionStartedAt).toISOString();

  // if (log.sessionEndedAt)
  //   log.sessionEndedAt = new Date(log.sessionEndedAt).toISOString();

  await clickhouse.insert({
    table: "logging.logs",
    values: [log],
    format: "JSONEachRow",
    clickhouse_settings: {
      date_time_input_format: "best_effort",
    },
  });

  console.log("Inserted log for project:", log.projectId);
}

async function start() {
  await testClickhouseConnection();

  consumer = kafka.consumer({ groupId: config.consumer.groupId });
  await consumer.connect();
  console.log("Kafka consumer connected");

  await consumer.subscribe({ topic: config.consumer.topic, fromBeginning: true });

  await consumer.run({
    eachMessage: async (payload) => {
      try {
        await processMessage(payload);
      } catch (err) {
        console.error("Failed to insert log:", err);
      }
    },
  });

  console.log("Kafka consumer running...");
}

async function shutdown() {
  console.log("Shutting down consumer...");
  if (consumer) {
    await consumer.disconnect();
    consumer = null;
  }
  await clickhouse.close();
}

module.exports = { start, shutdown };
