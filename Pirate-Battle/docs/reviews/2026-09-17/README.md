# Final coverage review — September 17, 2026

This review replaces the September 16 matrix for the current working tree. It covers the Tiled arena, audio, combat artwork, mobile controls, pagination, network recovery and the latest lifecycle fixes.

## Verification results

| Command | Result |
| --- | --- |
| `npm run typecheck` | Passed. |
| `npm run lint` | Passed after excluding generated Playwright report code from source linting. |
| `npm run build` | Passed. Vite still reports a main chunk over 500 kB. |
| `npm run test:performance` | **2 passed** in 3.4 minutes against a freshly built production preview. |
| Full Playwright suite | **138 passed, 7 failed, 1 skipped** in 11.0 minutes; Chromium desktop and Pixel 7 mobile, one worker, no retries. |
| Visual comparisons | **8 passed**: menu, arena, visible cannonball and result in both projects. |

The retained functional report is at `playwright-report/index.html`. Traces, screenshots and videos for the seven failures are generated under `test-results/final-2026-09-17/` and remain local runtime artifacts.

## Required 12-group matrix

| Challenge group | Current evidence | Status |
| --- | --- | --- |
| 1. Navigation, options and persistence | `lifecycle.spec.ts` covers validation, refresh persistence and audio settings; `accessibility.spec.ts` covers keyboard focus and dialog restoration. | Covered; passing in both projects. |
| 2. Asset loading, failure and retry | `main-menu.spec.ts` covers ship and atlas failures; `tiled-arena.spec.ts` covers map failure with Retry and no procedural fallback. | Covered; passing in both projects. |
| 3. Start, movement, rotation, bounds and islands | `main-menu.spec.ts`, `player-movement.spec.ts` and `tiled-arena.spec.ts` exercise real input and authored Collision geometry. | Partial in this run: the collision browser case failed on desktop and passed on mobile; direct simulation coverage passed in both. |
| 4. Weapons, damage, cooldown and score | `weapon-system.spec.ts`, `main-menu.spec.ts`, `enemies.spec.ts` and visual cannonball checks cover front/broadside fire, swept collision, damage and single scoring. | Covered; core combat cases passed in both projects. |
| 5. Chaser, Shooter and spawn interval | `enemies.spec.ts` covers seeded spawning, routing, clearance, range, line of sight, cooldown and damage. | Partial in this run: the combined rendered-enemy readiness assertion failed in both projects; the other enemy tests passed. |
| 6. Timeout/death ending and clean restart | `lifecycle.spec.ts` reaches real timer expiry and enemy death, registers once and starts a clean next match. | Covered; passing in both projects. |
| 7. Pause, focus loss and safe resume | `lifecycle.spec.ts` covers pause/resume and held-key clearing; accessibility/audio specs cover hidden-tab freezing and suspension. | Partial in this run: pause and key-reset passed, while hidden-tab effect and sailing-audio checks failed in both projects. |
| 8. Result display and refresh persistence | `lifecycle.spec.ts` restores a completed result and validates real completion details. | Covered; passing in both projects. |
| 9. Abandonment, repeated navigation and touch | `lifecycle.spec.ts`, `main-menu.spec.ts`, `accessibility.spec.ts` and the performance cycle test cover abandonment, resize, stable buttons and simultaneous touches. | Covered; passing in both projects. |
| 10. Ranking/history states and pagination | `menu-data.spec.ts` covers both tabs, stable ordering, all pages, shrinking totals, errors and stale-request cancellation. | Covered; passing in both projects. |
| 11. Registration, tab updates and pending recovery | `lifecycle.spec.ts` and `registration-recovery.spec.ts` cover tab invalidation, multiple pending matches and refresh recovery. | Covered; passing in both projects. |
| 12. Timeout retry, idempotency and stale responses | `network-scenarios.spec.ts`, `registration-recovery.spec.ts` and `menu-data.spec.ts` cover a real Axios timeout, accepted-response-loss retry, unique IDs and reversed same-list completion. | Covered; desktop timeout passes; its duplicate mobile run is intentionally skipped because it verifies the same client deadline. |

## Current failing checks

1. Hidden-tab effect setup can observe zero effects before the visibility change.
2. Hidden-tab audio setup does not observe `ship_sailing_loop.wav` before its deadline.
3. The combined rendered-enemy test waits for `data-enemies="[]"`, but that diagnostic is initially absent.
4. The authored-collision browser test failed once on desktop and passed on mobile in the same run.

The first three failures repeat per browser project, producing seven failures total with the single collision failure. The report preserves these results so the handoff does not present the suite as green.
