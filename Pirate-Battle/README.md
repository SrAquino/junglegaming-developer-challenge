# Pirate Battle

React, TypeScript and PixiJS game for the Pirate Battle challenge.

## Development

```bash
npm install
npm run dev
```

## Environment

No environment variables or private services are required. Ranking and match history are simulated in the browser by MSW, including in the production build.

## Available commands

- `npm run dev` starts the Vite development server.
- `npm run build` runs strict TypeScript checking and creates a production build.
- `npm run typecheck` runs strict TypeScript checking without building.
- `npm run lint` runs the linter.
- `npm run preview` previews the production build.
- `npm run test:e2e` runs Playwright in Chromium desktop and mobile projects.
- `npm run test:e2e:ui` opens the Playwright UI runner.
- `npm run test:e2e:report` opens the latest HTML report.
- `npm run test:e2e:update` updates approved visual snapshots.
- `npm run test:performance` rebuilds the app, starts an isolated optimized preview and records the three-minute and resource-cycle profiles.

Playwright creates a fresh browser context for each test. The test setup also clears local and session storage before each navigation. Functional HTML reports are written to `playwright-report/`; the retained performance report is written to `docs/performance/playwright-report/`. Traces, screenshots and videos from failures are written to `test-results/`.

## Deployment

Build with `npm run build`, then deploy the `Pirate-Battle` directory as a Vite project on Vercel. No build-time environment configuration is needed. After deployment, open the public URL and refresh it once to confirm that the bundled `mockServiceWorker.js`, assets, menu data and gameplay remain available.

## Gameplay configuration

Gameplay values live in `src/game/config/game-config.ts`. The default match lasts 120 seconds and spawns an enemy every 4 seconds. The Options screen will accept match durations from 60 to 180 seconds and spawn intervals from 1 to 20 seconds. Starting a match creates a deeply frozen configuration snapshot, so saved option changes affect only later matches.

Movement, rotation, health, collision sizes, spawn distribution, damage, projectile speed/range/lifetime, weapon cooldowns and Shooter range are part of the same typed configuration. Balance changes therefore do not require changes to the simulation systems.

The first two successful enemy spawns guarantee one Chaser and one Shooter; later spawns use the configured weights. Spawn candidates must be clear of the Tiled Collision polygons and ships and at least 420 logical pixels from the player. Enemies derive routes around those polygons, Chasers damage on impact without awarding score, and Shooters require range and unobstructed line of sight.

## Controls

- Sail forward: `W` or `↑`
- Turn left: `A` or `←`
- Turn right: `D` or `→`
- Fire ahead: `F`; fire left broadside: `Q`; fire right broadside: `E`

Mobile supports portrait and landscape layouts. Landscape is recommended during gameplay because it provides more room for the arena and simultaneous touch controls. Touch buttons use pointer capture and clear their held state on release, cancel, blur, visibility change or leaving gameplay.

## Audio

The Play click or first keyboard/touch control unlocks sound. Ocean ambience runs during an active match, sailing audio follows actual movement, and pause/hidden-tab handling suspends active media. Options persist mute and volume for later matches. The supplied combat, lifecycle, UI, score, warning and collision sounds are mapped in `docs/assets/asset-inventory.md`.

## Network scenarios

The main menu includes **Network controls** for reproducing API behavior through MSW. Choose a scenario, then open Ranking or History (or finish a match for registration scenarios). **Reset mock data** restores the fixture data, clears locally confirmed and pending submissions, and refreshes the active queries before reporting success.

| Scenario | Reproduction |
| --- | --- |
| `success` | Default ranking, history and registration behavior. |
| `empty` | Open either data tab to receive an empty list. |
| `multiple-pages` | Open Ranking or History and move through the generated pages. |
| `slow`, `variable-latency`, `out-of-order` | Refresh either data tab; these use controlled delays. |
| `offline`, `client-error`, `server-error` | Refresh a data tab or submit a completed match to see connection, 4xx or 5xx recovery. |
| `ranking-error`, `history-error` | Refresh the named tab while the other tab remains available. |
| `timeout` | Delays the response beyond Axios's configured deadline to exercise a real client timeout. |
| `timeout-after-register` | Simulates an accepted registration whose response is lost; retry after switching to `success` and the match ID prevents a duplicate record. |
| `unavailable-at-match-end` | Finish a match, switch back to `success`, then use Retry submission. |

Playwright fixes the timing and data used by these scenarios. Run `npm run test:e2e` to exercise them in desktop Chromium and mobile Chromium.

## Assets, balance and limitations

All art in `public/assets` was supplied with the challenge and remains subject to the source challenge's asset terms; no third-party art was added. The default balance intentionally gives the player faster movement than Chasers, introduces both enemy types in the first two spawns, and keeps Shooters outside their preferred firing distance until they have line of sight.

The arena loads `public/maps/arena.tmj` and its external JSON tileset at runtime. Tile positions, transparency and layer order come from Tiled; its Collision object layer supplies the polygons used by movement, projectiles, spawning and enemy routing. Ship damage uses supplied staged artwork, while the supplied combat atlas provides cannonballs, fire, explosions and debris. The September 17 optimized headless Chromium profile measured 28.63 FPS and a 50.0 ms p95 frame interval, below the 60 FPS target, with SwiftShader software rendering. Environment details, entity counts, five-cycle memory investigation and raw evidence are in `docs/performance/`; representative hardware validation is still required for a user-device performance claim.
