# Architecture

The application separates React user interfaces from the PixiJS game simulation and rendering layers. Dependencies flow from the application shell into feature modules and adapters; the simulation remains independent of React and HTTP.

- `src/app` owns application composition, providers and screens.
- `src/components` contains reusable React components.
- `src/game/core` declares the match lifecycle; `entities` declares simulation data; `systems` contains rules; `input` adapts keyboard and touch input; and `rendering` owns PixiJS resources.
- `src/features` groups user-interface behavior by domain.
- `src/api` provides Axios, typed contracts and TanStack Query keys. `src/mocks` owns MSW browser setup, handlers, fixtures and network scenarios.
- `src/storage` owns browser persistence.
- `tests` contains Playwright and visual regression coverage.

Further decisions are recorded as the systems are implemented.
