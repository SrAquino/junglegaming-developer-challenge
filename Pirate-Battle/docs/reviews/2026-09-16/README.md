# Sample, mobile layout and test audit — September 16, 2026

Source reviewed: `24237dc` (`feat: build island coastline from tiles`), with the subsequent local test-reliability repair described below. Scope: audit, then correct the test configuration and pause race before the requested visual redesign. Approved visual baselines were not changed. The existing removals of the three Vite starter assets were left as found. The deployment was not revalidated in this audit.

## Verification performed

| Command / check | Result |
| --- | --- |
| `npm run lint` | Passed. |
| `npm run typecheck` | Passed. |
| `npm run build` | Passed, including strict TypeScript compilation. Vite reports a main chunk over 500 kB; assess loading with profiling before changing bundling. |
| Initial `npm run test:e2e` audit | **71 passed, 3 failed, 74 total, 4.7 minutes**, one worker, no retries. It incorrectly included performance tests. |
| Repaired `npm run test:e2e` | **70 passed, 0 failed, 3.4 minutes**, one worker, no retries. Desktop and Pixel 7 Chromium; performance is excluded. |
| `npm run test:performance` | Both optimized-build checks completed: three-minute match and five same-page start/play/exit cycles. |
| Existing visual comparisons | All eight passed against the committed baselines, without `--update-snapshots`. These compare the previous design, not fidelity to the supplied sample. |
| Full-screen browser audit | Captured desktop, mobile portrait and landscape, with actual canvas/control bounds. Found landscape clipping despite the existing layout test passing. |
| Multiple-pages scenario through the real menu | API returned 48 entries; the UI showed Page 1 of 1 and disabled Next. |

The primary HTML report is at `playwright-report/index.html`; failure screenshots, videos and traces are in `test-results/`. These generated directories are ignored by Git. The review evidence below is retained separately. The test suite also contains direct simulation tests and browser `fetch()` contract checks, so 74 tests does not mean 74 complete browser journeys.

The default configuration formerly discovered `tests/performance` as well as functional tests. Its three-minute measurement hit the default 30-second timeout in both projects at `optimized-build.spec.ts:21`; this was a test configuration failure, not a measured FPS failure. `playwright.config.ts` now ignores that directory. `playwright.performance.config.ts` runs the profile alone, provides the 210-second timeout and writes its HTML report under `playwright-report/performance`. `npm run test:performance` names this command. The repaired profile uses the production preview server and five same-page cycles; its raw results are versioned in `docs/performance/`.

The third failure was `accessibility.spec.ts:21` on mobile: the `Match paused` dialog / `Resume match` button was absent when focus was asserted. The failure snapshot shows gameplay continuing at 116 seconds. The cause was a race: GameCanvas displayed Pause before `scene.mount()` had started the session, so `scene.pause()` returned false. Pause is now disabled until `aria-busy` becomes false. The focus test waits for that ready state, asserts that the dialog exists, and GameCanvas explicitly focuses Resume when opening the pause dialog. The mobile test passed three consecutive isolated repetitions and the complete repaired suite.

The dedicated profile had an obsolete `Active duration: 180.0 seconds` assertion and reloaded `/` before each heap cycle. It now asserts the actual result screen's `03:00` duration and uses one page through five start/play/exit cycles. The new profile completed both checks; its current measurements are in `docs/performance/`. They remain evidence from headless Chromium, not a claim of target-device 60 FPS.

## Visual and layout findings

Reference: [`sample.png`](../../../public/assets/sample.png). It shows a large grassy upper-left island with a fortification, lower landmasses, shallow-water bands and open combat channels. Ships are prominent. Health is at top left, score/time/pause at top right, movement at bottom left and weapons at bottom right, all within the game area.

Current source renders one 290×290 sand island in a 1600×900 world, an elliptical grass patch, three plants, three rocks and a short pier entirely inside the land. The coast is a rounded square while movement, shots, routing and spawning still use a circle. The center sand tile and grass mask visibly differ from the surrounding coastal texture. Most water is densely repeated, leaving the map much emptier than the sample. Decorative assets are present but the requested composition is incomplete.

Full-screen captures were taken in fresh browser contexts after a real Play/Pause sequence. Only the pause dialog was hidden for inspection; HUD and controls remained visible, and no simulation data was injected. The Pause button is absent in these paused captures by application design. Captures are audit evidence, not new regression baselines.

| Profile | Capture | Measured defect |
| --- | --- | --- |
| Desktop 1440×900 | [Desktop](desktop.png) | Controls occupy a separate row below the canvas; HUD is above it. |
| Pixel 7 portrait 412×839 CSS px | [Portrait](mobile-portrait.png) | Canvas is 224px high inside a 478.25px shell, leaving substantial unused space. Movement spans one full row and firing the next instead of two thumb clusters. |
| Mobile landscape 844×390 CSS px | [Landscape](mobile-landscape.png) | Canvas is 600px high inside a 124.625px shell with `overflow: hidden`; the player and island are clipped out. Controls sit below the shell at y=250. |

Exact CSS-pixel bounds: [layout-measurements.json](layout-measurements.json). Screenshots use the emulated device pixel ratio, so PNG dimensions differ from CSS dimensions. The existing landscape test checks only the shell bounds and button visibility, not the canvas or the world inside it. The stable-arena visual test screenshots the canvas alone and therefore cannot prove full-screen visibility or control placement.

### Canvas sizing repair

The initial clipping is fixed. `.game-canvas` now fills `.game-canvas-shell`, which is the same element observed by Pixi's `resizeTo`; the old inherited minimum height allowed the renderer to retain an unrelated 600px canvas height. The renderer now uses the active match arena dimensions rather than global defaults when it calculates contained-world scale. On portrait widths the shell itself uses 16:9, so the world no longer sits in a tall bordered area with blank bands.

The repaired accessibility check covers 1440×900, 412×839, 390×844, 844×390 and 667×375. For every size it asserts canvas bounds are inside the shell, world dimensions are contained and retain 16:9, document height does not exceed the viewport, exactly one canvas remains, and the same match ID persists through resize. It passed in both desktop and mobile Chromium projects. The mobile stable-arena and visible-cannonball visual baselines were intentionally updated after visual inspection.

Implementation target: a correctly sized complete world, landscape-first mobile presentation with portrait fallback, and two triangular button groups inside its lower corners. Use at least 48px touch targets, safe-area padding and a clear center. Anchor to the displayed world rectangle rather than empty aspect-ratio padding. Add whole-screen snapshots and true simultaneous pointer/touch tests before calling this done.

## Data and lifecycle findings

- Confirmed pagination defect: `fetchRanking()` and `fetchMatchHistory()` combine an already paginated response with local records, replace the server total with the current merged count, and paginate again. Ranking is reproduced in [pagination-observation.json](pagination-observation.json). For 48 server entries and page size 5, the first page should expose ten pages, not one. History contains the same adapter pattern and needs its own UI regression.
- Ranking's client tie-break drops the server completion-date ordering and recomputes ranks from a page. Preserve one authoritative order and global rank when fixing pagination.
- Query functions do not forward an AbortSignal. Existing Query keys help isolate configurations/pages, but same-list stale-response protection remains unproven. The current out-of-order mock delays ranking and history differently; it does not force newer/older responses for the same query to complete in reverse order.
- Match-history success invalidation uses page size 10 while the redesigned panel uses 5. Check invalidation by player/list prefix across all displayed pages.
- The mock record array is module-local. Successful client calls persist confirmed records, but a simulated timeout after server registration bypasses that persistence. The same-page direct-fetch idempotency test does not prove recovery after a reload.
- Keyboard input is listened for globally while GameCanvas remains mounted, including paused Options. Held state is not indexed by pointer ID; cover field editing, cancellation, lost capture and two fingers independently.
- Audio unlock only listens on the canvas host, while the current touch buttons and Play live outside it. `game_start` is attempted before unlocking. Sprite-creation callbacks trigger shot sounds, and cloned one-shot audio is not tracked on teardown. Settings tests do not test audibility or cleanup.

## Required Playwright groups: evidence and remaining coverage

| Challenge group | Existing evidence | Still required |
| --- | --- | --- |
| 1. Navigation/options | Options validation and persisted values in another page. | Actual reload persistence, full pause-options focus/keyboard behavior. |
| 2. Assets/retry | Ship-load abort and Retry through the browser. | Tile/atlas failure and cleanup while loading; enable gameplay actions only when ready. |
| 3. Movement/bounds/islands | Keyboard movement; direct movement-system circle checks. | Real browser contacts against the new coastline, all arena edges and rotation visibility. |
| 4. Weapons/damage/score | Weapon/combat system checks; browser projectile counts. | Real inputs causing enemy damage, three visible broadside shots, cooldown, one score per kill and obstruction. |
| 5. Enemy/spawn | Direct Chaser/Shooter routing/spawn checks and seeded browser appearance. | New multi-obstacle navigation, actual damage behaviors and spawn clearance. |
| 6. End/restart | Unit `finish()` guard and restart from a seeded stored result. | Real timer expiry/death, frozen simulation after end and fresh match state. |
| 7. Pause/blur | Manual pause, pause-options, elapsed time and synthetic blur. | Hidden tab, repeated resume, input reset and effects/audio freezing. |
| 8. Result persistence | Reload of a preseeded result. | Actual completed match result saved by the app and restored on reload. |
| 9. Abandon/repeat/touch | Two starts and mouse-held touch buttons. | No registration on abandonment, same-page cycles, real simultaneous touches and cancellation. |
| 10. Queries/pagination | Initial tabs, empty history, failures and direct-fetch pagination. | UI next/back in both tabs, totals/global ranks, refreshing and independent failures. |
| 11. Registration/pending | Direct handler registration and local persistence implementation. | End-to-end registration updating both tabs, several pending matches, actual refresh/recovery. |
| 12. Timeout/stale data | Same-page direct-fetch duplicate registration. | Timeout accepted before reload, unique retry recovery and reversed same-query completion. |

Asset usage and all 27 sound dispositions are detailed in [the inventory](../../assets/asset-inventory.md). The ordered implementation plan, per-step model/effort and acceptance checks are in [CHECKLIST.md section 15](../../../../CHECKLIST.md). Review claims were reopened where the current evidence is insufficient. No baseline should be approved solely because an update command succeeds.
