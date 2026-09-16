# Pirate Battle — Implementation Checklist

Requirements baseline: [INSTRUCTIONS.md](INSTRUCTIONS.md), preserved in Git. Original source: https://github.com/junglegaming/game-developer-challenge/blob/main/README.md

User-confirmed delivery estimate communicated to recruitment: September 17, 2026 at 16:00 (interpreted in the project's Brasília timezone). Internal submission target: September 17 at 14:00. The original email receipt time and a 48-hour limit are not established by INSTRUCTIONS.md and are not used as facts in this plan.

Initial planning estimate: 24–36 focused working hours for implementation, verification, profiling and delivery, assuming familiarity with React/TypeScript and assistance with PixiJS. This is a provisional engineering estimate, not measured throughput or a completion guarantee. Reassess after the first playable scene and reserve at least two hours before the confirmed deadline for delivery issues.

Execution order: 0 → 1 → 3 → 2 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13. Define simulation ownership, configuration and the clock before implementing the first moving scene; section numbers remain stable for tracking. Implement and verify each feature before marking it complete. Commit at each verified milestone. All product text, code identifiers and delivery documentation must be in English. Preserve the original Portuguese challenge as source material. Avoid optional features until all required items pass. Deployment target: Vercel; the user performs publication.

## Review and model budget

Audit against INSTRUCTIONS.md: all major delivery areas are covered. Explicit acceptance criteria below also cover score ordering and displayed columns, semantic match status, saving options, Chaser impact explosions, and reproducibility at different frame rates. Obstacle avoidance is a gameplay quality check; a general-purpose pathfinding system is not required. Audio is optional in the supplied instructions; visual combat feedback is required.

Each checkbox inherits its section's recommendation below unless an exception is listed. These are starting recommendations based on task complexity, not guaranteed minimum effort. The user confirmed access to Astra, Sol, Terra, Luna (reported as "Lua") and GPT-5.5. Model names: Luna = GPT-5.6 Luna; Terra = GPT-5.6 Terra; Sol = GPT-5.6 Sol.

| Section | Default model | Reasoning effort | Lower-cost exceptions / escalation |
| --- | --- | --- | --- |
| 0. Delivery agreement | Luna | Low | Dates, recruitment communication and reviewer access require user-provided facts or user action. |
| 1. Bootstrap | Terra | Low | Luna/Low for scripts, asset inventory and initial documentation; Terra/Medium for Playwright configuration or setup failures. |
| 2. First PixiJS scene | Terra | Medium | Sol/Medium only if asynchronous initialization or Strict Mode cleanup remains unresolved. |
| 3. Simulation/configuration | Sol | Medium | Luna/Low for documenting settled defaults; Terra/Medium for implementing already-defined types and configuration. |
| 4. Arena/input | Terra | Medium | Luna/Low for control labels; Sol/Medium for unresolved multitouch or coordinate/collision defects. |
| 5. Weapons/damage | Terra | Medium | Sol/Medium for unresolved collision ordering, duplicate damage or cooldown defects. |
| 6. Enemies/scoring | Terra | Medium | Sol/Medium if pursuit, safe spawning or simultaneous destruction rules need deeper diagnosis. |
| 7. Lifecycle/screens | Terra | Medium | Luna/Low for menu/result markup after contracts are fixed; Sol/Medium for unresolved pause/end/restart races. |
| 8. Contracts/mocks | Terra | Medium | Luna/Low for fixtures after schemas are fixed; Sol/Medium for unresolved idempotency or persistence design. |
| 9. Queries/submission | Sol | Medium | Terra/Medium for pagination and state presentation after the recovery protocol is defined. |
| 10. Failure scenarios | Terra | Medium | Luna/Low for scenario labels and reproduction instructions. |
| 11. Accessibility/E2E | Terra | Medium | Luna/Low for labels and copy; Sol/Medium for reproducible failures spanning input, simulation and rendering. |
| 12. Performance | Terra | Medium | Luna/Low for recording measured results; Sol/High only for a demonstrated leak or bottleneck that remains unexplained. |
| 13. Final audit | Terra | Medium | Luna/Low for documentation formatting and delivery draft; publication and sending remain user actions. |

Use one bounded feature and its acceptance checks per work session. Before implementation, state the recommended model/effort; this document does not change the active model automatically. Reuse the current model when switching would add more overhead than it saves. Escalate only after identifying a concrete failing check; do not repeatedly regenerate the same solution. Use High for a specific unresolved problem, not as the default. GPT-6 Astra is a fallback for a difficult cross-system issue; Extra High, Max and Ultra are not planned defaults. Run relevant tests and keep concise evidence with each completed milestone.

The task assignments above are project-specific judgments. Official model roles, reasoning guidance and account-dependent availability were checked on September 15, 2026 in [OpenAI's model documentation](https://learn.chatgpt.com/docs/models). Usage savings depend on the account plan, context size and retries; API token prices do not establish the user's Codex allowance consumption.

## 0. Confirm the delivery agreement

- [x] Record the delivery estimate confirmed by the user: September 17, 2026 at 16:00.
- [x] Inform recruitment of the estimated delivery time before implementation, as requested by the challenge (user confirmed this was done).
- [x] Initialize the local Git repository (verified existing commit: eb85ebe).
- [ ] Ensure the solution repository is available to reviewers; verify remote access separately from local Git initialization.
- [x] Preserve a copy of the challenge requirements for the final audit (tracked INSTRUCTIONS.md).

## 1. Bootstrap the project and verification tools

- [x] Create a Vite + React + TypeScript application with strict type checking.
- [x] Install compatible versions of PixiJS, TanStack Query, Axios, MSW and Playwright; commit the lockfile (commit `2cdc3e6`).
- [x] Add scripts for development, build, preview, lint and type checking (Playwright will be added with its dependency and test setup).
- [x] Separate simulation, rendering, input, React UI, API contracts, mocks and tests into clear modules.
- [x] Add initial README.md and ARCHITECTURE.md; update them as decisions are made.
- [x] Integrate the existing supplied assets into the build and retain their source and license information; document any additions or conversions.
- [x] Configure Chromium desktop and mobile Playwright projects, isolated state, HTML reports and traces on failure.
- [ ] Prepare an initial build for the user's early Vercel deployment; verify that opening and refreshing the public URL works after publication.

Exit condition: a clean checkout installs, builds and displays the application locally and publicly.

## 2. Learn PixiJS through the first playable scene

- [x] Understand only the initial essentials: Application, Container, Sprite, Assets, ticker and resource destruction.
- [x] Mount a PixiJS canvas inside React; load and display one supplied ship sprite.
- [x] Implement visible asset loading, failure feedback and retry before combat starts.
- [x] Reuse loaded textures and define ownership and cleanup of shared resources.
- [x] Move and rotate the sprite using elapsed simulation time, not pixels per frame.
- [x] Resize the canvas with device pixel density support, preserving arena proportions and input coordinates.
- [x] Verify mount, unmount and remount under React Strict Mode without duplicate canvases, tickers or listeners.
- [x] Add asset loading/retry and repeated navigation checks to Playwright.

Exit condition: one ship moves correctly, resizes correctly and leaves no active game loop after exiting.

## 3. Define the simulation and configuration

- [x] Define typed entities, vectors, player input, game states and result data.
- [x] Centralize duration, spawn interval/distribution, health, movement/rotation speeds, damage, projectile properties, weapon cooldowns and Shooter range.
- [x] Define and document positive minimum/maximum spawn intervals and gameplay defaults.
- [x] Create an immutable configuration snapshot for each new match.
- [x] Use a time-based simulation with a controlled timestep and bounded catch-up work; verify equivalent movement, combat and spawn timing under different render frame rates.
- [x] Add seeded randomness and a test clock that advances the real simulation.
- [x] Provide test observations without bypassing actual input, combat, collision or rendering rules.
- [x] Keep continuous combat state outside React; publish HUD snapshots and lifecycle events at a controlled rate.
- [x] Define start, playing, paused and ended transitions and a single guarded match-ending operation.

## 4. Implement arena, movement and controls

- [x] Render water and at least one island with the supplied assets.
- [x] Implement forward movement and left/right rotation on keyboard.
- [x] Keep ships inside the visible arena and prevent island traversal.
- [x] Define the supported mobile orientation and implement usable simultaneous touch controls.
- [x] Handle pointer release/cancel and clear held controls when leaving gameplay.
- [x] Capture game keys only while the gameplay context is active; display control instructions.
- [x] Verify forward movement, rotation, boundaries, island collisions, resizing and touch input in Playwright.

## 5. Implement weapons and damage

- [x] Add one frontal projectile and separate left/right broadside commands with three parallel projectiles per shot.
- [x] Support movement and firing simultaneously on keyboard and touch.
- [x] Enforce each weapon's cooldown and each projectile's direction, speed, damage and range or lifetime.
- [x] Block projectiles with islands; remove projectiles on impact, expiry or leaving the arena.
- [x] Restrict player shots to enemies and enemy shots to the player.
- [x] Apply damage only once per projectile, including overlapping targets or collisions in the same update.
- [x] Display health above player and enemy ships through PixiJS.
- [x] Add firing, impact, destruction and health-dependent deterioration feedback.
- [x] Test frontal/lateral attacks, cooldowns, obstacle blocking and damage through real game controls.

## 6. Implement enemies, spawns and scoring

- [x] Implement Chaser pursuit, rotation, collision damage and a visible explosion on self-destruction at player impact.
- [x] Implement Shooter approach, rotation and attacks within configured range.
- [x] Make both enemy types respect island collisions; verify they can approach around obstacles in the chosen arena.
- [x] Spawn at configured intervals in unobstructed positions sufficiently far from the player.
- [x] Ensure both enemy types appear during a standard match.
- [x] Award exactly one point per enemy destroyed by player attacks; award none for Chaser impact self-destruction.
- [x] Remove destroyed enemies from movement, damage, firing and collision processing immediately.
- [x] Test both behaviors, spawn timing, safe spawn positions and nonduplicated scoring.

Exit condition: a complete combat encounter works with both enemy types and all three weapons.

## 7. Complete match lifecycle and screens

- [ ] Build the menu with Play, Options, Ranking, Match History and instructions.
- [x] Implement Game session time (60–180 seconds) and Enemy spawn time with validation, explicit saving and refresh persistence; changes apply only to new matches.
- [x] Show score, remaining time and match status in semantic HTML, with score and time in the HUD; avoid announcements every frame.
- [x] Implement manual pause and automatic pause on blur or hidden tab.
- [x] Suspend simulation, clock, cooldowns and spawns during pause; resume only after explicit player action.
- [x] Clear stale input and reset frame timing on pause/resume to prevent accumulated movement or firing.
- [x] End on timeout or zero player health; stop movement, attacks, damage, spawns and scoring.
- [x] Show score, active duration, end reason, submission status, Play Again and Main Menu on the result screen.
- [x] Persist the last completed result and restore its presentation after refresh.
- [x] Reset health, time, score, entities and input when starting a new match.
- [x] Treat refresh or exit during combat as abandonment; never submit an abandoned match.
- [x] Test options, both end conditions, pause/blur/resume, result persistence, abandonment and clean restarts.

## 8. Implement ranking and history contracts and mocks

- [ ] Define typed paginated ranking/history APIs and the completed-match registration endpoint.
- [ ] Include match ID, player ID, date, score, active duration, end reason and configuration in every record.
- [ ] Persist a local player identity and use fixtures for other players.
- [ ] Sort ranking by descending score, group comparisons by the same gameplay configuration and define a deterministic tie-break rule.
- [ ] Share contracts, fixtures and MSW handlers across development, tests and the published demo.
- [ ] Persist confirmed records locally so ranking and history remain consistent after refresh.
- [ ] Make registration idempotent by match ID; repeated requests return the existing record.
- [ ] Initialize MSW in the published build and verify the worker is served at the correct path.

## 9. Integrate queries and resilient result submission

- [ ] Use Axios for HTTP and TanStack Query for queries and match-registration mutations.
- [ ] Implement pagination and loading, empty, error and background-refresh states for both tabs; ranking displays rank, player identity and score, while the player's history displays date, score, duration and end reason.
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
- [ ] Audit coverage against all 12 Playwright groups in INSTRUCTIONS.md, section 8.
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
- [ ] Have the user publish the final committed version to Vercel and verify it matches the delivered source.
- [ ] Verify public URL access, refresh, assets, mobile gameplay, ranking/history and recovery scenarios.
- [ ] Ensure repository access for reviewers and prepare a delivery email containing both repository and game URLs.
- [ ] Have the user submit before the deadline and retain the delivery confirmation.

## Suggested milestones

| Target | Milestone |
| --- | --- |
| First work session | Steps 0–4: setup, first deploy, PixiJS basics, moving ship and input |
| Next work session | Steps 5–7: complete local match; develop step 8 contracts alongside result data |
| Following work session | Steps 8–10: ranking/history, durable submission and failure scenarios |
| Final work session | Steps 11–13: coverage audit, profiling, documentation and final public verification |
| Two hours before deadline | Submission target; preserve remaining time for delivery issues |

Tests and documentation accompany implementation throughout; the final session audits and completes them. If a milestone slips, reassess immediately and remove only optional polish before considering any required-scope limitation, which must be documented honestly.
