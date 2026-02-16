function errorHandler(error, request, reply) {
  request.log.error(error);

  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? "Internal Server Error" : error.message;

  reply.code(statusCode).send({
    error: true,
    message,
    statusCode,
  });
}

module.exports = errorHandler;
