const Fastify = require("fastify");
const registerRoutes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const gracefulShutdown = require("./plugins/gracefulShutdown");
const producerService = require("./services/producer.service");

async function buildServer() {
  const app = Fastify({ logger: true });

  // Global error handler
  app.setErrorHandler(errorHandler);

  // Connect Kafka producer
  await producerService.connect();
  console.log("Kafka producer connected");

  // Register graceful shutdown
  app.register(gracefulShutdown, {
    onShutdown: async () => {
      await producerService.disconnect();
    },
  });

  // Register all routes
  await app.register(registerRoutes);

  return app;
}

module.exports = buildServer;
