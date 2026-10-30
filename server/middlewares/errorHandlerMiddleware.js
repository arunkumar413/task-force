module.exports = function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  req.log?.error({ err }, "Request failed");
  const validationError = err.name === "ValidationError" || err.name === "CastError";
  const status = validationError ? 400 : err.code === 11000 ? 409 : (err.status || 500);
  res.status(status).json({ statusMessage: status >= 500 ? "Internal server error" : err.message });
};
