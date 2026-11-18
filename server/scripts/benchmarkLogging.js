// Isolated loopback HTTP benchmark; never starts the application or connects to MongoDB.
const { fork } = require("node:child_process");
const { mkdtempSync, readdirSync, statSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const { performance } = require("node:perf_hooks");

if (process.env.LOG_BENCH_WORKER) {
  const express = require("express");
  const app = express();
  const mode = process.env.LOG_BENCH_WORKER;
  let logger;
  if (mode !== "disabled") {
    logger = require("../logger");
    app.use(require("../middlewares/requestLogger"));
  }
  app.use(express.json({ limit: "1mb" }));
  app.post("/probe", (req, res) => res.json({ ok: true }));
  const server = app.listen(0, "127.0.0.1", () => process.send({ port: server.address().port }));
  let cpuStart, started, peakRss;
  const sampler = setInterval(() => { peakRss = Math.max(peakRss || 0, process.memoryUsage().rss); }, 10);
  process.on("message", async message => {
    if (message === "start") {
      cpuStart = process.cpuUsage(); started = performance.now(); peakRss = process.memoryUsage().rss;
      process.send({ started: true });
    }
    if (message === "stop") {
      const elapsed = performance.now() - started;
      const cpu = process.cpuUsage(cpuStart);
      clearInterval(sampler);
      server.close();
      if (logger) await logger.close();
      process.send({ cpuMs: (cpu.user + cpu.system) / 1000, cpuPercent: (cpu.user + cpu.system) / (elapsed * 10), peakRssMiB: peakRss / 1048576 });
      process.disconnect();
    }
  });
} else {
  const count = Number(process.env.BENCH_REQUESTS || 5000);
  const concurrency = Number(process.env.BENCH_CONCURRENCY || 16);
  const repeats = Number(process.env.BENCH_REPEATS || 3);
  const nextMessage = child => new Promise((resolve, reject) => {
    const onExit = code => reject(new Error("Benchmark worker exited: " + code));
    child.once("exit", onExit);
    child.once("message", value => { child.off("exit", onExit); resolve(value); });
  });
  async function measure(mode, bytes) {
    const dir = mkdtempSync(path.join(tmpdir(), "task-force-bench-"));
    const child = fork(__filename, [], { env: { ...process.env, LOG_BENCH_WORKER: mode, LOG_DIR: dir, LOG_LEVEL: "info", LOG_MAX_SIZE: "10M", LOG_MAX_FILES: "14" }, silent: true });
    // Drain stdout as a pipe, rather than rendering logs in a terminal.
    child.stdout.resume(); child.stderr.pipe(process.stderr);
    try {
      const { port } = await nextMessage(child);
      const payload = JSON.stringify({ title: "Benchmark task", description: "x".repeat(bytes), credentials: { password: "synthetic-secret" } });
      const url = `http://127.0.0.1:${port}/probe`;
      async function send() {
        const start = performance.now();
        const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload });
        await response.arrayBuffer();
        if (!response.ok) throw new Error("HTTP " + response.status);
        return performance.now() - start;
      }
      for (let i = 0; i < 200; i++) await send();
      let waiting = nextMessage(child); child.send("start"); await waiting;
      let index = 0;
      const times = [];
      const start = performance.now();
      await Promise.all(Array.from({ length: concurrency }, async () => {
        while (index++ < count) times.push(await send());
      }));
      const elapsed = performance.now() - start;
      waiting = nextMessage(child); child.send("stop"); const metrics = await waiting;
      times.sort((a, b) => a - b);
      const logBytes = readdirSync(dir).reduce((sum, file) => sum + statSync(path.join(dir, file)).size, 0);
      return { mode, payloadBytes: Buffer.byteLength(payload), requests: count, concurrency, rps: count * 1000 / elapsed, p95Ms: times[Math.ceil(times.length * .95) - 1], p99Ms: times[Math.ceil(times.length * .99) - 1], ...metrics, logBytesIncludingWarmup: logBytes };
    } finally {
      child.kill();
      await new Promise(resolve => child.exitCode !== null || child.signalCode !== null ? resolve() : child.once("exit", resolve));
      rmSync(dir, { recursive: true, force: true });
    }
  }
  (async () => {
    const results = [];
    const modes = ["disabled", "metadata"];
    for (const bytes of [512, 4096, 65536]) {
      for (let repeat = 0; repeat < repeats; repeat++) {
        // Rotate mode order to reduce consistent warm-up/order bias.
        for (let offset = 0; offset < modes.length; offset++) {
          const result = await measure(modes[(repeat + offset) % modes.length], bytes);
          results.push({ repeat: repeat + 1, ...result });
        }
      }
    }
    process.stdout.write(JSON.stringify({ node: process.version, platform: process.platform, note: "Loopback, synthetic endpoint, drained stdout pipe; no database. Log bytes include 200 warm-up requests. CPU and RSS measure server process only. Results are not production capacity estimates.", results }, null, 2) + "\n");
  })().catch(err => { console.error(err); process.exitCode = 1; });
}
