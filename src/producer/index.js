const buildServer = require("../server");
const config = require("../config");

async function startProducer() {
  const app = await buildServer();

  app.listen({ port: config.server.port, host: config.server.host }, (err, address) => {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
    console.log(`Producer server running at ${address}`);
  });
}

startProducer().catch((err) => {
  console.error("Producer failed:", err);
  process.exit(1);
});
