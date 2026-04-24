const { buildLogRecords } = require("../utils/transformLog");
const { buildLiveLogEvents } = require("../utils/liveLogsFormatter");
const liveLogsSocketService = require("./liveLogsSocket.service");

async function publishLogs(body) {
  const records = buildLogRecords(body);
  const events = buildLiveLogEvents(records);

  liveLogsSocketService.broadcast(events);

  return { status: "published", count: events.length };
}

module.exports = { publishLogs };
