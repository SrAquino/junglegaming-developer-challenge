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

## Controls

- Sail forward: `W` or `↑`
- Turn left: `A` or `←`
- Turn right: `D` or `→`
- Fire ahead: `F`; fire left broadside: `Q`; fire right broadside: `E`

Mobile supports portrait and landscape layouts. Landscape is recommended during gameplay because it provides more room for the arena and simultaneous touch controls. Touch buttons use pointer capture and clear their held state on release, cancel, blur, visibility change or leaving gameplay.
