# Logging performance and configuration

**Historical results:** The body-logging configuration measured below has since been removed. Current HTTP logs exclude request bodies entirely, and the benchmark now compares disabled logging against the current metadata-only logger. Body-size configuration and sanitization measurements below describe the earlier implementation, not current behavior. Rotation and retention remain enabled.

Measured on 2026-11-18 with Node v24.18.0 on macOS. These are local synthetic measurements, not production capacity estimates.

## Implemented changes

- The HTTP completion record passes its body to the Pino body serializer, which sanitizes it once. The previous sanitizer in `customProps` has been removed.
- The serializer stops at a conservative 8,192-byte JSON budget or 50 nesting levels. Oversized bodies are replaced entirely by a truncation marker. Credentials remain redacted; original requests are not modified.
- Asynchronous file streams rotate daily or at 10 MB and retain 14 archives per file, plus the active file. Retention history survives restarts. Stdout remains enabled.
- Normal server SIGTERM/SIGINT shutdown drains file streams, subject to a 10-second shutdown deadline.

Configure `LOG_BODY_MAX_BYTES`, `LOG_MAX_SIZE`, `LOG_MAX_FILES`, `LOG_DIR`, and `LOG_LEVEL`; see the [environment example](../server/.env.example). Archive retention is a file count, not a number of days. Use a separate log directory for each process.

## Method

Run `npm --prefix server run benchmark:logging` from the repository root. The [benchmark](../server/scripts/benchmarkLogging.js) starts isolated Express workers on loopback without MongoDB. Each scenario uses 200 warm-up requests, 5,000 measured requests, and concurrency 16. Three repetitions rotate the mode order; the table reports each metric's median independently.

Modes are no logging middleware, Pino HTTP metadata only, and the actual bounded-body HTTP logger. The metadata-only mode uses Pino HTTP's default request serializer, while body mode uses the application's smaller request serializer. Therefore the comparison includes those serializer differences; it does not isolate just body redaction. Stdout is drained into a pipe. The endpoint parses JSON and returns a small JSON response. The client runs in a separate process on the same machine. CPU and sampled peak RSS measure the server worker; CPU can exceed 100% because it includes process threads. RSS includes parser allocations, logging, GC behavior, and runtime overhead.

## Results

| Payload | Logging | Requests/s | p95 ms | p99 ms | Server CPU % | Peak RSS MiB | File output MiB |
|---|---|---:|---:|---:|---:|---:|---:|
| 601 B | Disabled | 9,210 | 2.67 | 7.01 | 61.7 | 86.3 | 0 |
| 601 B | Metadata | 9,264 | 2.72 | 6.38 | 94.6 | 91.0 | 3.44 |
| 601 B | Bounded bodies | 10,244 | 2.68 | 6.52 | 132.2 | 119.4 | 5.54 |
| 4,185 B | Disabled | 9,302 | 2.90 | 7.25 | 67.8 | 88.4 | 0 |
| 4,185 B | Metadata | 9,200 | 2.99 | 7.22 | 108.0 | 92.6 | 3.44 |
| 4,185 B | Bounded bodies | 9,376 | 2.77 | 6.77 | 129.7 | 139.6 | 23.32 |
| 65,625 B | Disabled | 6,076 | 4.05 | 4.86 | 78.2 | 95.0 | 0 |
| 65,625 B | Metadata | 5,779 | 4.36 | 5.29 | 99.5 | 120.2 | 3.45 |
| 65,625 B | Bounded bodies | 5,561 | 4.81 | 6.77 | 120.2 | 292.4 | 3.01 |

File output includes warm-up records and rotation history files, but excludes stdout. Error duplication is not exercised by the benchmark.

The small-payload throughput differences are noisy and do not establish that logging improves performance. This short loopback run can be client-limited; it does show increased server CPU and memory consumption with logging. For the 64 KB scenario, bounded-body logging measured about 8.5% lower throughput and 19% higher p95 latency than disabled logging. Treat these as observations from this run rather than guaranteed overhead percentages.

The body limit substantially controls output volume: 64 KB request bodies produce truncation markers instead of full body logs. It does not bound total process memory or pending output queues; the 292 MiB peak shows that large-payload memory use still needs monitoring under sustained production load. Rotation bounds retained archive count, not transient buffering or external stdout retention. No compression is enabled, avoiding compression CPU overhead.

## Validation and limits

All three logging tests pass: nested redaction and body limits, size rotation and archive retention, and HTTP/file/stdout output with UUID v4 request IDs. The server suite passed 28 of 29 tests; the previously observed comment-upload test still expects HTTP 500 but receives 201.

This run does not compare the previous implementation against the optimized one, exercise daily rotation by waiting a day, or simulate disk-full conditions. It does not measure MongoDB-backed endpoint capacity, slow log collectors, long-lived production memory behavior, or multiple processes sharing a volume. Repeat on the deployment hardware with representative endpoint traffic before setting capacity targets.
