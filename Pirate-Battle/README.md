# Pirate Battle

React, TypeScript and PixiJS game for the Pirate Battle challenge.

## Development

```bash
npm install
npm run dev
```

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

Playwright creates a fresh browser context for each test. The test setup also clears local and session storage before each navigation. HTML reports are written to `playwright-report/`, while traces, screenshots and videos from failures are written to `test-results/`.

## Gameplay configuration

Gameplay values live in `src/game/config/game-config.ts`. The default match lasts 120 seconds and spawns an enemy every 4 seconds. The Options screen will accept match durations from 60 to 180 seconds and spawn intervals from 1 to 20 seconds. Starting a match creates a deeply frozen configuration snapshot, so saved option changes affect only later matches.

Movement, rotation, health, collision sizes, spawn distribution, damage, projectile speed/range/lifetime, weapon cooldowns and Shooter range are part of the same typed configuration. Balance changes therefore do not require changes to the simulation systems.

The first two successful enemy spawns guarantee one Chaser and one Shooter; later spawns use the configured weights. Spawn candidates must be clear of the island and ships and at least 420 logical pixels from the player. Enemies route around the central island, Chasers damage on impact without awarding score, and Shooters require range and line of sight.

## Controls

- Sail forward: `W` or `↑`
- Turn left: `A` or `←`
- Turn right: `D` or `→`
- Fire ahead: `F`; fire left broadside: `Q`; fire right broadside: `E`

Mobile supports portrait and landscape layouts. Landscape is recommended during gameplay because it provides more room for the arena and simultaneous touch controls. Touch buttons use pointer capture and clear their held state on release, cancel, blur, visibility change or leaving gameplay.

## Network scenarios

The main menu includes **Network controls** for reproducing API behavior through MSW. Choose a scenario, then open Ranking or History (or finish a match for registration scenarios). **Reset mock data** restores the fixture data and clears locally confirmed and pending submissions.

| Scenario | Reproduction |
| --- | --- |
| `success` | Default ranking, history and registration behavior. |
| `empty` | Open either data tab to receive an empty list. |
| `multiple-pages` | Open Ranking or History and move through the generated pages. |
| `slow`, `variable-latency`, `out-of-order` | Refresh either data tab; these use controlled delays. |
| `offline`, `client-error`, `server-error` | Refresh a data tab or submit a completed match to see connection, 4xx or 5xx recovery. |
| `ranking-error`, `history-error` | Refresh the named tab while the other tab remains available. |
| `timeout-after-register` | Finish a match, then retry its failed submission after switching back to `success`; the match ID prevents a duplicate record. |
| `unavailable-at-match-end` | Finish a match, switch back to `success`, then use Retry submission. |

Playwright fixes the timing and data used by these scenarios. Run `npm run test:e2e` to exercise them in desktop Chromium and mobile Chromium.
