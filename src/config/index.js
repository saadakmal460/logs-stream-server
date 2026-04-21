const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { logLevel } = require("kafkajs");

const config = {
  kafka: {
    clientId: process.env.KAFKA_CLIENT_ID || "log-ingestor",
    brokers: (process.env.KAFKA_BROKERS || "localhost:9092,localhost:9093,localhost:9094").split(","),
    logLevel: logLevel.ERROR,
    connectionTimeout: 10000,
    retry: {
      initialRetryTime: 1000,
      retries: 10,
    },
  },

  clickhouse: {
    url: process.env.CLICKHOUSE_URL || "http://localhost:8123",
    username: process.env.CLICKHOUSE_USER || "default",
    password: process.env.CLICKHOUSE_PASSWORD || "",
  },

  consumer: {
    groupId: process.env.CONSUMER_GROUP_ID || "clickhouse-ingestor-group",
    topic: process.env.KAFKA_TOPIC || "logs",
  },

  server: {
    port: Number(process.env.PORT || 3000),
    host: "0.0.0.0",
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET || "dummy-secret-replace-me",
  },
};

module.exports = config;
