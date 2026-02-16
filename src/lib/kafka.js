const { Kafka } = require("kafkajs");
const config = require("../config");

const kafka = new Kafka({
  clientId: config.kafka.clientId,
  brokers: config.kafka.brokers,
  logLevel: config.kafka.logLevel,
  connectionTimeout: config.kafka.connectionTimeout,
  retry: config.kafka.retry,
});

module.exports = kafka;
