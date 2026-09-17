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

`FirstPlayableScene` owns one Pixi `Application`, its ticker and canvas. Supplied ship PNGs and the combat atlas load through Pixi `Assets`; that cache retains shared textures across scene mounts. `combat-art-renderer.ts` owns ship, projectile and effect display objects. The scene destroys the application, canvas and complete stage tree when React unmounts, so wakes, trails, fire, debris and Tiled layers cannot survive a restart.

React Strict Mode may unmount a component while `Application.init()` is pending. The scene therefore defers destruction until initialization settles, and makes destruction idempotent. This prevents a stale initialization from leaving a ticker, listener or canvas behind.

## Simulation clock and lifecycle

`GameSession` owns the continuous world state outside React. It receives a clock, random source and simulation systems through constructor dependencies. Production uses the browser clock and random generator; deterministic tests use `ManualGameClock` and `SeededRandom` while executing the same session and system code.

Each render tick contributes elapsed time to `FixedTimestepLoop`. The loop advances rules in fixed steps, clamps a long frame to 250 ms and limits catch-up work to 15 steps. Pausing resets pending time and input, so time spent hidden or unfocused cannot move the simulation after resume.

React consumers subscribe to immutable HUD snapshots published at most every 100 ms, plus lifecycle boundaries. Tests and diagnostics use read-only observations of positions, entity counts and timing; they cannot mutate the world or skip gameplay systems.

The lifecycle accepts `idle → playing → paused → playing → ended`. A single guarded end operation creates results only for timeout or player destruction. Abandonment ends the session without a match result.

## Arena and input

The arena uses the logical dimensions authored in `public/maps/arena.tmj`. The runtime derives them from Tiled width, height and tile size, then Pixi scales and centers that world inside the responsive canvas. `tiled-map-loader.ts` loads the map and external JSON tileset, parses the Collision object layer and preserves ordered tile data. `tiled-map-renderer.ts` renders `AguaRasa`, `Land` and `Decorations`, including Tiled flip flags. `arena-geometry.ts` applies the parsed collision polygons to movement, swept projectiles, line of sight and spawning.

`playerMovementSystem` runs in the fixed simulation loop. It applies rotation and forward velocity from the immutable input snapshot, then constrains the ship to arena edges and rejects a movement that intersects a coastline. `BrowserGameInput` listens only while `GameCanvas` is mounted, tracks touch actions by pointer ID so two controls remain independent, and clears all held actions on release, cancellation, lost capture, blur, visibility change, resize and cleanup.

## Combat

`weapon-system.ts` creates typed front and broadside projectiles from the configuration, while `projectile-system.ts` advances and expires them. `combat-system.ts` applies a projectile hit once, removes it immediately and awards one point only when a player shot destroys an enemy. `effect-system.ts` advances finite effect lifetimes only with simulation time. Pixi maps health ratios to supplied damaged ship art and renders bounded wakes, trails, animated fire/explosions, sinking ships and debris independently from the rules. Reduced-motion mode removes continuous wake/trail motion and uses stable effect frames.

Systems append semantic events for weapons, impacts, damage, destruction, score and collision to the world. `GameSession.drainEvents()` gives each event to the audio adapter once; Pixi sprite creation does not trigger sound. `GameAudio` persists at the app level so the Play gesture can unlock media before the async scene loads. It rotates supplied variants, caps one-shots, gates warnings, starts sailing only with motion and releases media resources on pause, exit, result and restart.

## Enemies and spawning

`enemy-spawn-system.ts` consumes active simulation time and tries bounded random positions that are inside the arena, clear of every coast and other ships, and at least the configured safe distance from the player. The first two successful spawns are a Chaser and Shooter so a default match always demonstrates both behaviors; subsequent spawns use the configured weights.

`enemy-behavior-system.ts` rotates and advances both types using elapsed simulation time. Chasers explode on contact, damage the player once and award no score. Shooters stop near their configured preferred distance and fire only with direct line of sight, inside attack range and after cooldown. When land blocks a direct route, `enemy-navigation.ts` runs a small visibility graph over the map's declared channel waypoints and respects each hull's clearance.

## Match lifecycle and UI

`GameSession` owns continuous match state. Its throttled HUD subscription drives React's semantic score, time and hull display without React renders for every Pixi frame. `GameCanvas` pauses the session on an explicit action, blur or hidden tab; resuming requires the pause dialog. Browser gameplay input is disabled and cleared while loading or paused, then enabled only after an explicit successful resume, so keys pressed in dialogs cannot carry into combat. Session lifecycle events persist completed results locally, while leaving combat abandons the session without a result. Options are validated and persisted separately, then converted to an immutable configuration snapshot when a new match begins.

## Mock API contracts

Every new match receives a `crypto.randomUUID()`-based ID, independent of simulation randomness. A completed match retains this ID for submission retries and reload recovery. Explicit simulation seeds reproduce gameplay without reusing registration identities; an absent or empty seed uses browser randomness. Core tests can inject an ID factory when comparing complete deterministic snapshots.

`api/contracts.ts` defines paginated ranking and history responses plus completed-match registration. Match IDs make registration idempotent. `gameplayConfigurationKey.ts` groups ranking entries by the complete gameplay balance represented in a configuration snapshot, including the versioned arena layout, dimensions, spawn placement and clock scale. The arena layout ID must change with authored collision geometry. Within a group, the mock orders entries by descending score, then ascending completion date and match ID for a deterministic tie-break.

MSW starts before React renders in development and the published build. Its worker is versioned at `public/mockServiceWorker.js`, and its fixtures and handlers are shared by local development and Playwright. The local identity and confirmed registration store provide browser persistence for the query layer.

## Query and submission flow

Ranking and history tabs use Axios request functions through TanStack Query. Query keys include the configuration grouping, player and pagination values, while focus revalidation keeps visible tabs current. Both paginated panels clamp their active page when refreshed data has fewer pages, then request the last valid page. Mock reset clears local submission stores and awaits invalidation of both query families before reporting success. A completed match is written to pending local storage before its mutation begins. Successful registrations remove that entry, persist the confirmed record and invalidate both data sets. Failed entries remain available for bounded automatic retries after refresh or an explicit retry from the result screen. A restored result derives `submitted` from its matching confirmed record.

## Reproducible network scenarios

The main-menu scenario control stores a named scenario in local storage and dispatches a browser event so active ranking and history queries refetch. The Axios client sends that scenario in a request header; MSW then applies deterministic fixture data, delay or failure behavior. `timeout` delays beyond the Axios deadline, while `timeout-after-register` models an accepted registration with a lost response. The mock reset endpoint restores fixture state, and the browser reset also removes confirmed and pending local records. Retrying the same match ID verifies idempotent recovery.

## Performance and limitations

The optimized-build profile builds the production bundle, serves it on an isolated preview port, warms the shared asset cache, then runs the normal Pixi scene for 180 seconds while sampling browser animation-frame intervals and rendered entity counts. A profiling-only query flag raises the player's hull so combat cannot end the required measurement early; it is never used in the normal game path. The same command performs five Play → Pause → Main menu cycles in one page and records heap, DOM, listener, canvas, resource, audio and entity counters in `docs/performance`.

The September 17 headless Chromium profile measured 28.63 FPS and 50.0 ms p95 with SwiftShader and did not meet the 60 FPS target. DOM, listeners and canvases were stable after the first lifecycle cycle, while forced-GC heap samples still increased by 14.36% from cycle 1 to 5. The Tiled loader now caches only successful parsed maps, avoiding repeated fetch/parse work while preserving Retry after a failure. Audio is implemented by the app-scoped `GameAudio` adapter and semantic simulation events. Full general-purpose pathfinding and server persistence remain outside the challenge scope; gameplay options, results, pending submissions and confirmed records use local storage.
