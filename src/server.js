const Fastify = require("fastify");
const registerRoutes = require("./routes");
const config = require("./config");
const errorHandler = require("./middleware/errorHandler");
const gracefulShutdown = require("./plugins/gracefulShutdown");
const liveLogsSocketService = require("./services/liveLogsSocket.service");
const producerService = require("./services/producer.service");
const mongo = require("./lib/mongo");
const redis = require("./lib/redis");

function resolveCorsOrigin(allowedOrigin, requestOrigin) {
  if (!requestOrigin) {
    return null;
  }

  if (allowedOrigin === "*") {
    return "*";
  }

  if (Array.isArray(allowedOrigin)) {
    return allowedOrigin.includes(requestOrigin) ? requestOrigin : null;
  }

  return allowedOrigin === requestOrigin ? requestOrigin : null;
}

async function buildServer() {
  const app = Fastify({ logger: true });
  const corsConfig = config.server.cors;

  app.addHook("onRequest", async (request, reply) => {
    const requestOrigin = request.headers?.origin;
    const allowedOrigin = resolveCorsOrigin(corsConfig.origin, requestOrigin);

    if (allowedOrigin) {
      reply.header("Access-Control-Allow-Origin", allowedOrigin);
    }

    if (allowedOrigin && allowedOrigin !== "*") {
      reply.header("Vary", "Origin");
    }

    if (corsConfig.credentials) {
      reply.header("Access-Control-Allow-Credentials", "true");
    }

    reply.header("Access-Control-Allow-Methods", corsConfig.methods.join(", "));
    reply.header("Access-Control-Allow-Headers", corsConfig.allowedHeaders.join(", "));
    reply.header("Access-Control-Max-Age", String(corsConfig.maxAge));

    if (request.method === "OPTIONS") {
      return reply.code(204).send();
    }
  });

  // Global error handler
  app.setErrorHandler(errorHandler);

  // Attach the websocket upgrade handler before the server starts listening.
  liveLogsSocketService.attach(app.server);

  // Connect MongoDB
  await mongo.connect();

  // Connect Redis
  await redis.connect();

  // Connect Kafka producer
  await producerService.connect();
  console.log("Kafka producer connected");

  // Register graceful shutdown
  app.register(gracefulShutdown, {
    onShutdown: async () => {
      await liveLogsSocketService.close();
      await producerService.disconnect();
      await redis.disconnect();
      await mongo.disconnect();
    },
  });

  // Register all routes
  await app.register(registerRoutes);

  return app;
}

module.exports = buildServer;
