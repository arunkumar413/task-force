const { test } = require("node:test");
const assert = require("node:assert/strict");
const { mkdtempSync, readFileSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

test("Pino writes application and error files, honors verbosity, and redacts secrets", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "task-force-logging-"));
  try {
    const result = spawnSync(process.execPath, ["-e", `
      const express = require('express');
      const request = require('supertest');
      const logger = require('./logger');
      const app = express();
      app.use(require('./middlewares/requestLogger'));
      app.use(express.json());
      app.post('/probe', (req, res) => {
        req.log.info({ body: req.body, password: req.body.password }, 'Probe request');
        if (req.body.password !== 'secret-password' || req.body.members[0].OTP !== 'secret-otp') throw new Error('Request was mutated');
        res.json({ ok: true });
      });
      (async () => {
        logger.debug('Debug entry');
        logger.info('Info entry');
        logger.error({ err: new Error('Probe failure') }, 'Error entry');
        await request(app).post('/probe').set('Cookie', 'secret-cookie').set('Authorization', 'Bearer secret-token').send({ title: 'Visible title', password: 'secret-password', members: [{ OTP: 'secret-otp', name: 'Visible member', credentials: { access_token: 'secret-access', apiKey: 'secret-key', confirmPassword: 'secret-confirm' } }] }).expect(200);
        logger.flush();
      })().catch(err => { console.error(err); process.exitCode = 1; });
    `], { cwd: path.join(__dirname, ".."), env: { ...process.env, LOG_DIR: dir, LOG_LEVEL: "debug" }, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const raw = readFileSync(path.join(dir, "app.log"), "utf8");
    const logs = raw.trim().split("\n").map(line => JSON.parse(line));
    const errors = readFileSync(path.join(dir, "error.log"), "utf8").trim().split("\n").map(line => JSON.parse(line));
    assert.ok(logs.some(log => log.msg === "Debug entry"));
    assert.ok(logs.some(log => log.msg === "Info entry"));
    assert.equal(errors.length, 1);
    assert.equal(errors[0].err.message, "Probe failure");
    const http = logs.find(log => log.msg === "request completed");
    assert.ok(http.req.id);
    assert.match(http.req.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    assert.equal(http.req.method, "POST");
    assert.equal(http.res.statusCode, 200);
    assert.equal(typeof http.responseTime, "number");
    assert.equal(http.req.headers, undefined);
    assert.equal(http.body.title, "Visible title");
    assert.equal(http.body.password, "[redacted]");
    assert.equal(http.body.members[0].name, "Visible member");
    assert.equal(http.body.members[0].OTP, "[redacted]");
    assert.equal(http.body.members[0].credentials.access_token, "[redacted]");
    const manual = logs.find(log => log.msg === "Probe request");
    assert.equal(manual.body.title, "Visible title");
    assert.equal(manual.body.members[0].credentials.apiKey, "[redacted]");
    assert.ok(!/secret-cookie|secret-token|secret-password|secret-otp|secret-access|secret-key|secret-confirm/.test(raw + result.stdout));
    assert.ok(result.stdout.includes("Info entry"));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
