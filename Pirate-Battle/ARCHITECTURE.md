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

## First Pixi scene

`FirstPlayableScene` owns one Pixi `Application`, its ticker and canvas. It uses the supplied `ship_1.png` through Pixi `Assets`; that cache retains the shared texture across scene mounts. The scene destroys only the application, canvas and stage children when the React component unmounts, leaving cached textures available for a later game scene.

React Strict Mode may unmount a component while `Application.init()` is pending. The scene therefore defers destruction until initialization settles, and makes destruction idempotent. This prevents a stale initialization from leaving a ticker, listener or canvas behind.

## Simulation clock and lifecycle

`GameSession` owns the continuous world state outside React. It receives a clock, random source and simulation systems through constructor dependencies. Production uses the browser clock and random generator; deterministic tests use `ManualGameClock` and `SeededRandom` while executing the same session and system code.

Each render tick contributes elapsed time to `FixedTimestepLoop`. The loop advances rules in fixed steps, clamps a long frame to 250 ms and limits catch-up work to 15 steps. Pausing resets pending time and input, so time spent hidden or unfocused cannot move the simulation after resume.

React consumers subscribe to immutable HUD snapshots published at most every 100 ms, plus lifecycle boundaries. Tests and diagnostics use read-only observations of positions, entity counts and timing; they cannot mutate the world or skip gameplay systems.

The lifecycle accepts `idle → playing → paused → playing → ended`. A single guarded end operation creates results only for timeout or player destruction. Abandonment ends the session without a match result.

## Arena and input

The arena uses a 1600×900 logical coordinate system. Pixi scales and centers that coordinate system inside the responsive canvas, preserving proportions while `Application` handles device pixel density. Water is rendered by Pixi and the central island combines a blocking circular shape with supplied tile artwork.

`playerMovementSystem` runs in the fixed simulation loop. It applies rotation and forward velocity from the immutable input snapshot, then constrains the ship to arena edges and rejects a movement that intersects the island. `BrowserGameInput` listens only while `GameCanvas` is mounted, merges keyboard and touch holds so controls can be used together, and clears all held actions on release, cancellation, blur, visibility change and cleanup.

## Combat

`weapon-system.ts` creates typed front and broadside projectiles from the configuration, while `projectile-system.ts` advances and expires them. `combat-system.ts` applies a projectile hit once, removes it immediately and awards one point only when a player shot destroys an enemy. `effect-system.ts` expires muzzle, impact and explosion feedback. Pixi renders projectile sprites, transient effects and health bars independently from simulation.
