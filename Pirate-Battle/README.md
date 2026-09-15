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
