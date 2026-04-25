const mongoose = require("mongoose");
const config = require("../config");

async function connect() {
  if (!config.mongo.uri) {
    throw new Error("MONGO_URI is not set");
  }
  await mongoose.connect(config.mongo.uri);
  console.log("MongoDB connected");
}

async function disconnect() {
  await mongoose.disconnect();
}

module.exports = { connect, disconnect, mongoose };
