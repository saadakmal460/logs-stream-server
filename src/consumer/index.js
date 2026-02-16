const consumerService = require("../services/consumer.service");

async function startConsumer() {
  await consumerService.start();

  const shutdown = async () => {
    await consumerService.shutdown();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startConsumer().catch((err) => {
  console.error("Consumer failed:", err);
  process.exit(1);
});
