const pino = require("pino");
const pinoHttp = require("pino-http");
const { randomUUID } = require("node:crypto");
const logger = require("../logger");
const redactLogData = require("../utils/redactLogData");

module.exports = pinoHttp({
  logger,
  genReqId: () => randomUUID(),
  customProps: req => ({ body: redactLogData(req.body), query: redactLogData(req.query), params: req.params, ip: req.ip }),
  serializers: {
    err: pino.stdSerializers.err,
    req(req) {
      return {
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
        remotePort: req.remotePort,
      };
    },
  },
});
