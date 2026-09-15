# Architecture

The application separates React user interfaces from the PixiJS game simulation and rendering layers.

- `src/app` owns application composition, providers and screens.
- `src/components` contains reusable React components.
- `src/game` contains the time-based game simulation, input handling and PixiJS rendering.
- `src/features` groups user-interface behavior by domain.
- `src/api` and `src/mocks` provide typed HTTP contracts and browser mocks.
- `src/storage` owns browser persistence.
- `tests` contains Playwright and visual regression coverage.

Further decisions are recorded as the systems are implemented.
