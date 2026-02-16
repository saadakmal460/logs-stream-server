const kafka = require("../lib/kafka");
const config = require("../config");
const { buildMessages } = require("../utils/transformLog");

let producer = null;

async function connect() {
  producer = kafka.producer();
  await producer.connect();
  return producer;
}

async function disconnect() {
  if (producer) {
    await producer.disconnect();
    producer = null;
  }
}

async function sendLogs(body) {
  const messages = buildMessages(body);

  producer
    .send({ topic: config.consumer.topic, messages, acks: 0 })
    .catch((err) => {
      console.error("Kafka send error:", err);
    });

  return { status: "accepted", count: messages.length };
}

function getProducer() {
  return producer;
}

module.exports = { connect, disconnect, sendLogs, getProducer };
