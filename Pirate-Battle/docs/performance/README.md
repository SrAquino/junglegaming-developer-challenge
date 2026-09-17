# Optimized-build performance evidence

Measured on September 17, 2026 with the minified production bundle generated immediately before the run. `npm run test:performance` now builds the application, starts an isolated Vite preview on port 4187, runs the dedicated Playwright profile, writes the HTML and JSON evidence, and stops the preview process.

## Reference environment

| Item | Value |
| --- | --- |
| Operating system | Windows 10.0.26200 x64 |
| CPU | AMD Ryzen 5 4600G with Radeon Graphics, 12 logical processors |
| System memory | 16,484,818,944 bytes (15.35 GiB) |
| Browser | Playwright Chromium 153.0.8010.12, headless |
| Rendering | ANGLE / Vulkan / SwiftShader software renderer |
| Node | 22.20.0 |
| Viewport | 1440 × 900 CSS pixels, DPR 1 |

The GPU field reports SwiftShader because headless Chromium used software rendering. These figures describe this machine and browser mode; they do not estimate a phone, a headed browser with hardware acceleration, or the deployed Vercel build.

## Three-minute profile

The test performs one warm-cache start/exit cycle, then starts a new 180-second match. It uses a 20-second spawn interval, continuous forward/right input and the profiling-only 100,000-hull setting so combat cannot end the run. Gameplay time remains at 1×. Animation-frame intervals are captured for 180 seconds and live Pixi entity diagnostics are sampled once per second.

| Measure | Observed value |
| --- | ---: |
| Measurement window | 180,009.7 ms |
| Average frame rate | 28.63 FPS |
| Frame-interval p95 | 50.0 ms |
| Maximum enemies | 6 |
| Maximum projectiles | 6 |
| Maximum effects | 4 |
| Match completed early | No |

The run completed and the result screen reported `03:00 / Time expired`, but it did **not** meet the 60 FPS target in this software-rendered headless environment. Hardware-accelerated checks on representative desktop and mobile devices remain necessary before making a user-device performance claim.

## Resource-cycle investigation

The second test stays in one browser document and repeats the real **Play → one second active → Pause → Main menu** path five times. It forces garbage collection through CDP before each post-exit sample, clears Resource Timing between cycles and records heap, DOM, listeners, canvases, resource requests, audio and live entity counters.

| Cycle | JS heap after exit | Documents | DOM nodes | Listeners | Canvas | Resource entries |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 7,724,232 B | 2 | 457 | 212 | 0 | 31 |
| 2 | 7,982,948 B | 2 | 457 | 212 | 0 | 17 |
| 3 | 8,278,124 B | 2 | 457 | 212 | 0 | 17 |
| 4 | 8,554,040 B | 2 | 457 | 212 | 0 | 17 |
| 5 | 8,833,692 B | 2 | 457 | 212 | 0 | 17 |

The heap increased by 1,109,460 bytes, or 14.36%, from cycle 1 to cycle 5 and increased in every sample. This is a retained-growth signal, not proof of a leak. The structural counters stayed identical after the first cycle, every Pixi canvas was removed, and pre-exit entity/audio counts remained bounded. The Resource Timing count also stabilized at 17 entries per cycle after its buffer was cleared.

The investigation found that the Tiled JSON map and tileset were fetched and parsed for every match. The loader now caches a successful parsed arena for the page lifetime and removes failed promises from the cache so Retry still performs a fresh request. Later cycles no longer request `arena.tmj` or `tiles_sheet.tsj`. The remaining repeated entries are the ranking refresh, visible control/HUD images and lifecycle audio loads. A heap snapshot in a headed, hardware-accelerated browser is the next step if the monotonic heap trend also appears on target devices.

## Retained artifacts

- `optimized-build-measurement.json`: raw environment, configuration and frame/entity metrics.
- `resource-cycle-memory.json`: raw baseline, per-cycle samples, paths and calculated deltas.
- `playwright-report/index.html`: passing HTML report for both performance tests.

Run the same measurement with:

```bash
npm run test:performance
```
