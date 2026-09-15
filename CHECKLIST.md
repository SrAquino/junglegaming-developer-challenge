# Pirate Battle — Implementation Checklist

Source: https://github.com/junglegaming/game-developer-challenge/blob/main/README.md

Planning assumption: email received on September 15, 2026 at 16:00 Brasília time. Deadline: September 17 at 16:00 Brasília time; target submission: September 17 at 14:00. Confirm the date against the email header. This is a proposed work sequence, not a guarantee of completion within the available time.

Work in order. Implement and verify each feature before marking it complete. Commit at each verified milestone. All product text, code identifiers and delivery documentation must be in English. Avoid optional features until all required items pass.

## 0. Confirm the delivery agreement

- [ ] Confirm the exact email timestamp and deadline.
- [ ] Inform recruitment of the estimated delivery time before implementation, as requested by the challenge.
- [ ] Create the solution repository and ensure reviewers will be able to access it.
- [ ] Preserve a copy of the challenge requirements for the final audit.

## 1. Bootstrap the project and verification tools

- [ ] Create a Vite + React + TypeScript application with strict type checking.
- [ ] Install compatible versions of PixiJS, TanStack Query, Axios, MSW and Playwright; commit the lockfile.
- [ ] Add scripts for development, build, preview, lint, type checking and Playwright.
- [ ] Separate simulation, rendering, input, React UI, API contracts, mocks and tests into clear modules.
- [ ] Add initial README.md and ARCHITECTURE.md; update them as decisions are made.
- [ ] Copy the supplied assets and retain their source and license information; document any additions or conversions.
- [ ] Configure Chromium desktop and mobile Playwright projects, isolated state, HTML reports and traces on failure.
- [ ] Publish an initial build early and verify that opening and refreshing the public URL works.

Exit condition: a clean checkout installs, builds and displays the application locally and publicly.

## 2. Learn PixiJS through the first playable scene

- [ ] Understand only the initial essentials: Application, Container, Sprite, Assets, ticker and resource destruction.
- [ ] Mount a PixiJS canvas inside React; load and display one supplied ship sprite.
- [ ] Implement visible asset loading, failure feedback and retry before combat starts.
- [ ] Reuse loaded textures and define ownership and cleanup of shared resources.
- [ ] Move and rotate the sprite using elapsed simulation time, not pixels per frame.
- [ ] Resize the canvas with device pixel density support, preserving arena proportions and input coordinates.
- [ ] Verify mount, unmount and remount under React Strict Mode without duplicate canvases, tickers or listeners.
- [ ] Add asset loading/retry and repeated navigation checks to Playwright.

Exit condition: one ship moves correctly, resizes correctly and leaves no active game loop after exiting.

## 3. Define the simulation and configuration

- [ ] Define typed entities, vectors, player input, game states and result data.
- [ ] Centralize duration, spawn interval/distribution, health, movement/rotation speeds, damage, projectile properties, weapon cooldowns and Shooter range.
- [ ] Define and document positive minimum/maximum spawn intervals and gameplay defaults.
- [ ] Create an immutable configuration snapshot for each new match.
- [ ] Use a time-based simulation with a controlled timestep and bounded catch-up work.
- [ ] Add seeded randomness and a test clock that advances the real simulation.
- [ ] Provide test observations without bypassing actual input, combat, collision or rendering rules.
- [ ] Keep continuous combat state outside React; publish HUD snapshots and lifecycle events at a controlled rate.
- [ ] Define start, playing, paused and ended transitions and a single guarded match-ending operation.

## 4. Implement arena, movement and controls

- [ ] Render water and at least one island with the supplied assets.
- [ ] Implement forward movement and left/right rotation on keyboard.
- [ ] Keep ships inside the visible arena and prevent island traversal.
- [ ] Define the supported mobile orientation and implement usable simultaneous touch controls.
- [ ] Handle pointer release/cancel and clear held controls when leaving gameplay.
- [ ] Capture game keys only while the gameplay context is active; display control instructions.
- [ ] Verify forward movement, rotation, boundaries, island collisions, resizing and touch input in Playwright.

## 5. Implement weapons and damage

- [ ] Add one frontal projectile and separate left/right broadside commands with three parallel projectiles per shot.
- [ ] Support movement and firing simultaneously on keyboard and touch.
- [ ] Enforce each weapon's cooldown and each projectile's direction, speed, damage and range or lifetime.
- [ ] Block projectiles with islands; remove projectiles on impact, expiry or leaving the arena.
- [ ] Restrict player shots to enemies and enemy shots to the player.
- [ ] Apply damage only once per projectile, including overlapping targets or collisions in the same update.
- [ ] Display health above player and enemy ships through PixiJS.
- [ ] Add firing, impact, destruction and health-dependent deterioration feedback.
- [ ] Test frontal/lateral attacks, cooldowns, obstacle blocking and damage through real game controls.

## 6. Implement enemies, spawns and scoring

- [ ] Implement Chaser pursuit, rotation, collision damage and self-destruction on player impact.
- [ ] Implement Shooter approach, rotation and attacks within configured range.
- [ ] Make both enemy types respect island collisions; verify they can approach around obstacles in the chosen arena.
- [ ] Spawn at configured intervals in unobstructed positions sufficiently far from the player.
- [ ] Ensure both enemy types appear during a standard match.
- [ ] Award exactly one point per enemy destroyed by player attacks; award none for Chaser impact self-destruction.
- [ ] Remove destroyed enemies from movement, damage, firing and collision processing immediately.
- [ ] Test both behaviors, spawn timing, safe spawn positions and nonduplicated scoring.

Exit condition: a complete combat encounter works with both enemy types and all three weapons.

## 7. Complete match lifecycle and screens

- [ ] Build the menu with Play, Options, Ranking, Match History and instructions.
- [ ] Implement Game session time (60–180 seconds) and Enemy spawn time with validation and refresh persistence.
- [ ] Show score and remaining time in the HUD and semantic HTML; avoid announcements every frame.
- [ ] Implement manual pause and automatic pause on blur or hidden tab.
- [ ] Suspend simulation, clock, cooldowns and spawns during pause; resume only after explicit player action.
- [ ] Clear stale input and reset frame timing on pause/resume to prevent accumulated movement or firing.
- [ ] End on timeout or zero player health; stop movement, attacks, damage, spawns and scoring.
- [ ] Show score, active duration, end reason, submission status, Play Again and Main Menu on the result screen.
- [ ] Persist the last completed result and restore its presentation after refresh.
- [ ] Reset health, time, score, entities and input when starting a new match.
- [ ] Treat refresh or exit during combat as abandonment; never submit an abandoned match.
- [ ] Test options, both end conditions, pause/blur/resume, result persistence, abandonment and clean restarts.

## 8. Implement ranking and history contracts and mocks

- [ ] Define typed paginated ranking/history APIs and the completed-match registration endpoint.
- [ ] Include match ID, player ID, date, score, active duration, end reason and configuration in every record.
- [ ] Persist a local player identity and use fixtures for other players.
- [ ] Group ranking comparisons by the same configuration and define a deterministic tie-break rule.
- [ ] Share contracts, fixtures and MSW handlers across development, tests and the published demo.
- [ ] Persist confirmed records locally so ranking and history remain consistent after refresh.
- [ ] Make registration idempotent by match ID; repeated requests return the existing record.
- [ ] Initialize MSW in the published build and verify the worker is served at the correct path.

## 9. Integrate queries and resilient result submission

- [ ] Use Axios for HTTP and TanStack Query for queries and match-registration mutations.
- [ ] Implement pagination and loading, empty, error and background-refresh states for both tabs.
- [ ] Use query keys that include the relevant player, configuration and pagination parameters.
- [ ] Invalidate and refresh both tabs after successful registration and when they become visible again.
- [ ] Prevent delayed responses from replacing data for a newer request or state.
- [ ] Persist pending submissions before sending; preserve all pending matches, including across refresh.
- [ ] Implement bounded retries, explicit retry actions and clear submission status.
- [ ] Recover a timeout after server-side registration without duplicate history or ranking entries.
- [ ] Allow starting another match while previous submissions remain pending.
- [ ] Keep API failures from blocking menus, options or combat.
- [ ] Test pagination, both tabs updating, pending recovery after refresh, duplicate retries and stale responses.

## 10. Complete reproducible failure scenarios

- [ ] Provide a scenario selector and reset-to-initial-state action.
- [ ] Cover success, empty lists and multiple pages.
- [ ] Cover slow requests, variable latency and out-of-order responses.
- [ ] Cover timeout, connection errors and HTTP 4xx/5xx responses.
- [ ] Allow ranking and history queries to fail independently.
- [ ] Cover timeout after successful registration with idempotent recovery.
- [ ] Cover unavailability at match end followed by recovery and registration.
- [ ] Control latency and randomness in tests; document how to reproduce each scenario.
- [ ] Verify scenarios and persistence in the public production build.

## 11. Finish accessibility, visuals and required E2E coverage

- [ ] Verify desktop/mobile layouts have no clipped arena, HUD or controls.
- [ ] Verify keyboard navigation, visible focus, dialog focus management and focus restoration.
- [ ] Add form labels, sufficient contrast and accessible validation/network error messages.
- [ ] Confirm all UI text, identifiers and documentation are in English.
- [ ] Audit coverage against all 12 Playwright groups in the source README.
- [ ] Run the main flows in Chromium desktop and mobile with isolated initial state.
- [ ] Capture and inspect deterministic visual baselines for the menu, stable arena and result screen; commit them.
- [ ] Generate the HTML report and retain traces of failures for diagnosis; fix failures and rerun affected coverage.
- [ ] Check that expected flows produce no unhandled console errors.

## 12. Measure performance in the optimized build

- [ ] Measure a three-minute match: frame rate, frame-interval p95 and entity counts over time, targeting 60 FPS.
- [ ] Record hardware, browser/version, resolution, pixel density, match configuration and measurement method.
- [ ] Profile memory and active resources across five start/play/exit cycles.
- [ ] Investigate sustained growth in listeners, ticker subscriptions, entities, textures or other resources.
- [ ] Record real profiling evidence and observed limitations; do not replace measurements with estimates.

## 13. Audit and deliver

- [ ] Complete README.md: setup, environment variables, controls, gameplay configuration, network scenarios/reset and every required command.
- [ ] Complete ARCHITECTURE.md: React/Pixi integration, simulation, collision approach, resource ownership, persistence, API contracts, cache and pending recovery.
- [ ] Document balancing decisions, limitations, sources and licenses for assets.
- [ ] Include test reports, visual baselines and profiling evidence in the deliverable.
- [ ] Verify installation, lint, type checking, build and required tests from a clean checkout.
- [ ] Publish the final committed version and verify it matches the delivered source.
- [ ] Verify public URL access, refresh, assets, mobile gameplay, ranking/history and recovery scenarios.
- [ ] Ensure repository access for reviewers and include both repository and game URLs in the delivery email.
- [ ] Submit before the deadline and retain the delivery confirmation.

## Suggested milestones

| Target | Milestone |
| --- | --- |
| First work session | Steps 0–4: setup, first deploy, PixiJS basics, moving ship and input |
| Next work session | Steps 5–7: complete local match; develop step 8 contracts alongside result data |
| Following work session | Steps 8–10: ranking/history, durable submission and failure scenarios |
| Final work session | Steps 11–13: coverage audit, profiling, documentation and final public verification |
| Two hours before deadline | Submission target; preserve remaining time for delivery issues |

Tests and documentation accompany implementation throughout; the final session audits and completes them. If a milestone slips, reassess immediately and remove only optional polish before considering any required-scope limitation, which must be documented honestly.
