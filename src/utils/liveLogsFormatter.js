const { createHash } = require("crypto");

const LEVEL_MAP = {
  fatal: "error",
  error: "error",
  err: "error",
  warn: "warning",
  warning: "warning",
  success: "success",
  ok: "success",
  info: "info",
  debug: "info",
  trace: "info",
};

function normalizeLevel(level) {
  const normalized = String(level || "").trim().toLowerCase();
  return LEVEL_MAP[normalized] || "info";
}

function formatTimestamp(timestamp) {
  const parsed = timestamp ? new Date(timestamp) : new Date();
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function parseMeta(meta) {
  if (!meta) return {};

  if (typeof meta === "string") {
    try {
      const parsed = JSON.parse(meta);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      return { meta };
    }
  }

  if (typeof meta === "object" && !Array.isArray(meta)) {
    return meta;
  }

  return { meta: JSON.stringify(meta) };
}

function toMetadata(meta, extras) {
  const metadata = {};

  for (const source of [meta, extras]) {
    if (!source || typeof source !== "object") continue;

    for (const [key, value] of Object.entries(source)) {
      if (value === undefined || value === null || value === "") continue;
      metadata[key] = typeof value === "object" ? JSON.stringify(value) : String(value);
    }
  }

  return Object.keys(metadata).length ? metadata : undefined;
}

function resolveService(log) {
  return log.loggerName || log.component || log.service || "unknown-service";
}

function buildId(log, service) {
  const seed = [
    log.projectId || "",
    log.correlationId || "",
    log.timestamp || "",
    service,
    log.message || "",
  ].join("|");

  return createHash("sha1").update(seed).digest("hex").slice(0, 24);
}

function formatLiveLog(log) {
  const service = resolveService(log);
  const metadata = toMetadata(parseMeta(log.meta), {
    correlation_id: log.correlationId,
    request_method: log.requestMethod,
    request_path: log.requestPath,
    status_code: log.statusCode,
  });

  return {
    id: buildId(log, service),
    timestamp: formatTimestamp(log.timestamp),
    level: normalizeLevel(log.level),
    service,
    message: log.message || "",
    ...(metadata ? { metadata } : {}),
  };
}

function formatLiveLogs(logs) {
  return (Array.isArray(logs) ? logs : []).map(formatLiveLog);
}

function buildLiveLogEvents(logs) {
  return (Array.isArray(logs) ? logs : [])
    .map((log) => ({
      projectId: String(log.projectId || ""),
      log: formatLiveLog(log),
    }))
    .filter((entry) => entry.projectId);
}

module.exports = {
  buildLiveLogEvents,
  formatLiveLog,
  formatLiveLogs,
  normalizeLevel,
};
