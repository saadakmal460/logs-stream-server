const jwt = require("jsonwebtoken");
const config = require("../config");

function extractToken(request) {
  const header = request.headers["authorization"];
  if (!header) return null;

  const parts = header.split(" ");
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
    return parts[1];
  }

  return header.trim() || null;
}

async function authenticate(request, reply) {
  const token = extractToken(request);

  if (!token) {
    return reply.code(401).send({
      error: true,
      statusCode: 401,
      message: "No token found. Authorization header is required.",
    });
  }

  try {
    const payload = jwt.verify(token, config.auth.jwtSecret);
    request.auth = payload;
  } catch (err) {
    const message =
      err.name === "TokenExpiredError"
        ? "Token has expired."
        : "Invalid token.";

    return reply.code(401).send({
      error: true,
      statusCode: 401,
      message,
    });
  }
}

module.exports = authenticate;
