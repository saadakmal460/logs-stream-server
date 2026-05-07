const ApiToken = require("../models/apiToken.model");
const redis = require("../lib/redis");
const config = require("../config");

const CACHE_PREFIX = "apitoken:";
const NEGATIVE_MARKER = "__invalid__";

function extractBearer(authHeader) {
  if (!authHeader || typeof authHeader !== "string") return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

async function resolveProjectId(authHeader) {
  const rawToken = extractBearer(authHeader);
  console.log("Extracted token: ", rawToken);
  if (!rawToken) return null;

  const cacheKey = CACHE_PREFIX + rawToken;
  const client = redis.getClient();
  console.log("raw token: ", rawToken);

  if (client) {
    try {
      console.log("Checking cache for token:", rawToken);
      const cached = await client.get(cacheKey);
      if (cached === NEGATIVE_MARKER) return null;
      if (cached) return cached;
    } catch (err) {
      console.error("Redis get error:", err);
    }
  }

  const doc = await ApiToken.findOne({ token: rawToken }).lean();
  console.log("project: ", doc)
  const projectId = doc ? doc.project_id : null;

  if (client) {
    try {
      if (projectId) {
        await client.set(cacheKey, projectId, {
          EX: config.redis.tokenTtlSeconds,
        });
      } else {
        await client.set(cacheKey, NEGATIVE_MARKER, {
          EX: config.redis.tokenNegativeTtlSeconds,
        });
      }
    } catch (err) {
      console.error("Redis set error:", err);
    }
  }

  return projectId;
}

module.exports = { resolveProjectId, extractBearer };
