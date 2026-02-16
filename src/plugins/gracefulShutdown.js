const fp = require("fastify-plugin");

function gracefulShutdown(app, opts, done) {
  const { onShutdown } = opts;

  const shutdown = async (signal) => {
    app.log.info(`Received ${signal}, shutting down...`);
    try {
      if (onShutdown) {
        await onShutdown();
      }
      await app.close();
    } catch (err) {
      app.log.error(err, "Error during shutdown");
    }
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  done();
}

module.exports = fp(gracefulShutdown, { name: "graceful-shutdown" });
