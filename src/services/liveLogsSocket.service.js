const { createHash } = require("crypto");
const { URL } = require("url");

const SOCKET_PATH = "/live-logs/socket";
const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

const clientsByProject = new Map();

let attachedServer = null;

function sendHttpError(socket, statusCode, statusText, message) {
  const body = Buffer.from(message, "utf8");
  socket.write(
    [
      `HTTP/1.1 ${statusCode} ${statusText}`,
      "Connection: close",
      "Content-Type: text/plain; charset=utf-8",
      `Content-Length: ${body.length}`,
      "",
      "",
    ].join("\r\n")
  );
  socket.write(body);
  socket.destroy();
}

function encodeFrame(payload, opcode) {
  const data = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
  const payloadLength = data.length;

  if (payloadLength < 126) {
    return Buffer.concat([Buffer.from([0x80 | opcode, payloadLength]), data]);
  }

  if (payloadLength < 65536) {
    const header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 126;
    header.writeUInt16BE(payloadLength, 2);
    return Buffer.concat([header, data]);
  }

  const header = Buffer.alloc(10);
  header[0] = 0x80 | opcode;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(payloadLength), 2);
  return Buffer.concat([header, data]);
}

function parseFrame(buffer) {
  if (buffer.length < 2) return null;

  const firstByte = buffer[0];
  const secondByte = buffer[1];
  let payloadLength = secondByte & 0x7f;
  let offset = 2;

  if (payloadLength === 126) {
    if (buffer.length < 4) return null;
    payloadLength = buffer.readUInt16BE(2);
    offset = 4;
  } else if (payloadLength === 127) {
    if (buffer.length < 10) return null;
    payloadLength = Number(buffer.readBigUInt64BE(2));
    offset = 10;
  }

  const isMasked = Boolean(secondByte & 0x80);
  const maskLength = isMasked ? 4 : 0;

  if (buffer.length < offset + maskLength + payloadLength) return null;

  const payloadStart = offset + maskLength;
  const payloadEnd = payloadStart + payloadLength;
  const payload = Buffer.from(buffer.subarray(payloadStart, payloadEnd));

  if (isMasked) {
    const mask = buffer.subarray(offset, offset + 4);
    for (let index = 0; index < payload.length; index += 1) {
      payload[index] ^= mask[index % 4];
    }
  }

  return {
    bytesConsumed: payloadEnd,
    frame: {
      fin: Boolean(firstByte & 0x80),
      opcode: firstByte & 0x0f,
      payload,
    },
  };
}

function ensureProjectClients(projectId) {
  if (!clientsByProject.has(projectId)) {
    clientsByProject.set(projectId, new Set());
  }

  return clientsByProject.get(projectId);
}

function removeClient(client) {
  const clients = clientsByProject.get(client.projectId);
  if (!clients) return;

  clients.delete(client);
  if (!clients.size) {
    clientsByProject.delete(client.projectId);
  }
}

function closeClient(client, payload = Buffer.alloc(0)) {
  try {
    if (!client.socket.destroyed) {
      client.socket.end(encodeFrame(payload, 0x8));
    }
  } catch (error) {
    client.socket.destroy();
  } finally {
    removeClient(client);
  }
}

function handleClientData(client, chunk) {
  client.buffer = Buffer.concat([client.buffer, chunk]);

  while (true) {
    const parsed = parseFrame(client.buffer);
    if (!parsed) return;

    client.buffer = client.buffer.subarray(parsed.bytesConsumed);

    if (!parsed.frame.fin) {
      closeClient(client);
      return;
    }

    if (parsed.frame.opcode === 0x8) {
      closeClient(client, parsed.frame.payload);
      return;
    }

    if (parsed.frame.opcode === 0x9 && !client.socket.destroyed) {
      client.socket.write(encodeFrame(parsed.frame.payload, 0x0a));
    }
  }
}

function handleUpgrade(request, socket) {
  const requestUrl = new URL(request.url, "http://localhost");
  if (requestUrl.pathname !== SOCKET_PATH) {
    socket.destroy();
    return;
  }

  const projectId = requestUrl.searchParams.get("projectId");
  const websocketKey = request.headers["sec-websocket-key"];

  if (!projectId) {
    sendHttpError(socket, 400, "Bad Request", "projectId is required");
    return;
  }

  if (!websocketKey) {
    sendHttpError(socket, 400, "Bad Request", "Missing Sec-WebSocket-Key header");
    return;
  }

  const acceptKey = createHash("sha1")
    .update(`${websocketKey}${WS_GUID}`, "utf8")
    .digest("base64");

  socket.write(
    [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${acceptKey}`,
      "",
      "",
    ].join("\r\n")
  );

  socket.setKeepAlive(true);
  socket.setNoDelay(true);

  const client = {
    buffer: Buffer.alloc(0),
    projectId,
    socket,
  };

  ensureProjectClients(projectId).add(client);

  socket.on("data", (chunk) => handleClientData(client, chunk));
  socket.on("close", () => removeClient(client));
  socket.on("end", () => removeClient(client));
  socket.on("error", () => removeClient(client));
}

function attach(server) {
  if (attachedServer === server) return;

  if (attachedServer) {
    attachedServer.off("upgrade", handleUpgrade);
  }

  attachedServer = server;
  attachedServer.on("upgrade", handleUpgrade);
}

function broadcast(logEvents) {
  for (const entry of logEvents || []) {
    const clients = clientsByProject.get(entry.projectId);
    if (!clients || !clients.size) continue;

    const frame = encodeFrame(JSON.stringify(entry.log), 0x1);
    for (const client of [...clients]) {
      if (client.socket.destroyed) {
        removeClient(client);
        continue;
      }

      try {
        client.socket.write(frame);
      } catch (error) {
        client.socket.destroy();
        removeClient(client);
      }
    }
  }
}

async function close() {
  if (attachedServer) {
    attachedServer.off("upgrade", handleUpgrade);
    attachedServer = null;
  }

  for (const clients of clientsByProject.values()) {
    for (const client of clients) {
      closeClient(client);
    }
  }

  clientsByProject.clear();
}

module.exports = {
  attach,
  broadcast,
  close,
  SOCKET_PATH,
};
