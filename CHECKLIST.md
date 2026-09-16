# Pirate Battle — Implementation Checklist

Requirements baseline: [INSTRUCTIONS.md](INSTRUCTIONS.md), preserved in Git. Original source: https://github.com/junglegaming/game-developer-challenge/blob/main/README.md

User-confirmed delivery estimate communicated to recruitment: September 17, 2026 at 16:00 (interpreted in the project's Brasília timezone). Internal submission target: September 17 at 14:00. The original email receipt time and a 48-hour limit are not established by INSTRUCTIONS.md and are not used as facts in this plan.

Initial planning estimate: 24–36 focused working hours for implementation, verification, profiling and delivery, assuming familiarity with React/TypeScript and assistance with PixiJS. This is a provisional engineering estimate, not measured throughput or a completion guarantee. Reassess after the first playable scene and reserve at least two hours before the confirmed deadline for delivery issues.

Execution order: 0 → 1 → 3 → 2 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13. Define simulation ownership, configuration and the clock before implementing the first moving scene; section numbers remain stable for tracking. Implement and verify each feature before marking it complete. Commit at each verified milestone. All product text, code identifiers and delivery documentation must be in English. Preserve the original Portuguese challenge as source material. Avoid optional features until all required items pass. Deployment target: Vercel; the user performs publication.

## Review and model budget

### Post-deployment scope update

Initial deployment reported by the user: https://pirate-battle-snowy.vercel.app/. Public gameplay and source-version parity still require verification.

The user requested closer alignment with all supplied samples, larger ships, visible cannonballs, richer tile-based scenery, sprite animations and supplied audio. This is now accepted scope, including audio. Complete section 14 before the final delivery audit in section 13; keep the outstanding query/recovery checks in section 9. Earlier visual and performance checks describe the previous version and must be repeated after this work.

Review every asset family and record its intended use. Default/retina PNGs, atlases and vector sources can represent the same artwork: select the appropriate runtime representation and document alternatives, rather than loading duplicate copies. Samples and previews are references; interactive screens must remain real accessible UI.

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
| 14. Visual, asset and audio completion | Terra | Medium | Each subsection below specifies its recommendation; Sol/Medium for unresolved rendering or audio lifecycle defects. |

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

- [x] Build the menu with Play, Options, Ranking, Match History and instructions.
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

- [x] Define typed paginated ranking/history APIs and the completed-match registration endpoint.
- [x] Include match ID, player ID, date, score, active duration, end reason and configuration in every record.
- [x] Persist a local player identity and use fixtures for other players.
- [x] Sort ranking by descending score, group comparisons by the same gameplay configuration and define a deterministic tie-break rule.
- [x] Share contracts, fixtures and MSW handlers across development, tests and the published demo.
- [x] Persist confirmed records locally so ranking and history remain consistent after refresh.
- [x] Make registration idempotent by match ID; repeated requests return the existing record.
- [x] Initialize MSW in the published build and verify the worker is served at the correct path.

## 9. Integrate queries and resilient result submission

- [x] Use Axios for HTTP and TanStack Query for queries and match-registration mutations.
- [x] Implement pagination and loading, empty, error and background-refresh states for both tabs; ranking displays rank, player identity and score, while the player's history displays date, score, duration and end reason.
- [x] Use query keys that include the relevant player, configuration and pagination parameters.
- [x] Invalidate and refresh both tabs after successful registration and when they become visible again.
- [ ] Prevent delayed responses from replacing data for a newer request or state.
- [x] Persist pending submissions before sending; preserve all pending matches, including across refresh.
- [x] Implement bounded retries, explicit retry actions and clear submission status.
- [x] Recover a timeout after server-side registration without duplicate history or ranking entries.
- [x] Allow starting another match while previous submissions remain pending.
- [x] Keep API failures from blocking menus, options or combat.
- [ ] Test pagination, both tabs updating, pending recovery after refresh, duplicate retries and stale responses.

## 10. Complete reproducible failure scenarios

- [x] Provide a scenario selector and reset-to-initial-state action.
- [x] Cover success, empty lists and multiple pages.
- [x] Cover slow requests, variable latency and out-of-order responses.
- [x] Cover timeout, connection errors and HTTP 4xx/5xx responses.
- [x] Allow ranking and history queries to fail independently.
- [x] Cover timeout after successful registration with idempotent recovery.
- [x] Cover unavailability at match end followed by recovery and registration.
- [x] Control latency and randomness in tests; document how to reproduce each scenario.
- [ ] Verify scenarios and persistence in the public production build.

## 11. Finish accessibility, visuals and required E2E coverage

- [x] Verify desktop/mobile layouts have no clipped arena, HUD or controls.
- [x] Verify keyboard navigation, visible focus, dialog focus management and focus restoration.
- [x] Add form labels, sufficient contrast and accessible validation/network error messages.
- [x] Confirm all UI text, identifiers and documentation are in English.
- [x] Audit coverage against all 12 Playwright groups in INSTRUCTIONS.md, section 8.
- [x] Run the main flows in Chromium desktop and mobile with isolated initial state.
- [x] Capture and inspect deterministic visual baselines for the menu, stable arena and result screen; commit them.
- [x] Generate the HTML report and retain traces of failures for diagnosis; fix failures and rerun affected coverage.
- [x] Check that expected flows produce no unhandled console errors.

## 12. Measure performance in the optimized build

- [x] Measure a three-minute match: frame rate, frame-interval p95 and entity counts over time, targeting 60 FPS.
- [x] Record hardware, browser/version, resolution, pixel density, match configuration and measurement method.
- [x] Profile memory and active resources across five start/play/exit cycles.
- [x] Investigate sustained growth in listeners, ticker subscriptions, entities, textures or other resources.
- [x] Record real profiling evidence and observed limitations; do not replace measurements with estimates.

## 13. Audit and deliver

- [x] Complete README.md: setup, environment variables, controls, gameplay configuration, network scenarios/reset and every required command.
- [x] Complete ARCHITECTURE.md: React/Pixi integration, simulation, collision approach, resource ownership, persistence, API contracts, cache and pending recovery.
- [x] Document balancing decisions, limitations, sources and licenses for assets.
- [x] Include test reports, visual baselines and profiling evidence in the deliverable.
- [ ] Verify installation, lint, type checking, build and required tests from a clean checkout.
- [ ] Have the user publish the final committed version to Vercel and verify it matches the delivered source.
- [ ] Verify public URL access, refresh, assets, mobile gameplay, ranking/history and recovery scenarios.
- [ ] Ensure repository access for reviewers and prepare a delivery email containing both repository and game URLs.
- [ ] Have the user submit before the deadline and retain the delivery confirmation.

## 14. Match the supplied samples and complete asset integration

Execution order: 14.1 asset map, 14.2 projectile/ship readability, 14.3 shared UI, 14.4 screens, 14.5 arena, 14.6 effects, 14.7 audio, 14.8 verification. Each checkbox inherits its subsection's model/effort recommendation. Update this section only after the corresponding implementation and acceptance check pass.

### 14.1 Asset inventory and visual reference — Luna / Low

- [x] Create an asset usage map covering `png/default`, `png/retina`, `spritesheet`, `tilesheet`, `vector`, `sounds`, `ui_scene_background.png`, the logo, samples and preview; identify runtime uses, source/reference files and duplicate resolutions.
- [x] Map frames in `ui_sheet.json` and `ui_sheet_retina.json` to panels, buttons, icons, tabs and bars; inspect padding and stretchable regions before implementing responsive UI.
- [x] Map the ship XML atlases and the grid described by `tilesheet/tilesheets.txt`; distinguish atlas packing from actual animation sequences.
- [x] Compare `sample_menu.png`, `sample_options.png`, `sample_history.png`, `sample_ranking.png`, `sample_pause.png`, `sample_result.png` and `sample.png`; record layout, spacing, palette, typography and relative sprite sizes.

### 14.2 Visible cannonballs and larger ships — Terra / Medium

- [x] Diagnose the reported invisible cannonballs: inspect texture loading, source dimensions, transparent padding, scale, anchor, draw order and contrast in the published and local builds.
- [x] Render visibly textured front and broadside cannonballs for both sides; verify all three broadside projectiles remain distinguishable on desktop and mobile, including during motion.
- [x] Increase player, Chaser and Shooter visual sizes using typed presentation settings; preserve distinct silhouettes and align health bars and muzzle origins with the artwork.
- [ ] Review collision radii, island clearance, spawn distance and navigation after resizing ships; verify that visible hulls do not misleadingly overlap obstacles or targets.

### 14.3 Shared nautical UI — Terra / Medium

- [x] Build reusable responsive panels and gold/wood buttons from the supplied UI atlas, with dark navy interiors and cream/gold typography matching the samples.
- [x] Use `ui_scene_background.png` and the supplied logo where shown in menu samples, preserving legibility at narrow viewport sizes.
- [x] Add consistent hover, pressed, selected, disabled and keyboard-focus states, accessible icon labels and adequate touch targets.
- [x] Keep text and controls in semantic React markup; use artwork for decoration and scalable frames, not screenshots of complete sample screens.
- [ ] Move network scenario controls into a clearly discoverable secondary demo panel so they remain usable without dominating the main menu.

### 14.4 Menu, logbook, options, pause and result — Terra / Medium

- [ ] Recreate the menu hierarchy from `sample_menu.png`: title, primary Play/Options actions, ship illustration, control instructions and Ranking/Match History navigation.
- [ ] Style Options after `sample_options.png` with labelled minus/plus controls and editable numeric values; retain range validation, explicit save and persistence. Sample values do not silently change gameplay defaults.
- [ ] Build the Captain's Log layout from `sample_history.png`: date and time, points, duration in mm:ss, result badges, five-row pagination and Main Menu action; retain loading, empty, refreshing and error states.
- [ ] Build Ranking from `sample_ranking.png`: rank, captain, points, played date/time, local-player highlight and active configuration label; extend contracts/fixtures if necessary to supply real displayed fields.
- [ ] Match `sample_pause.png` with Resume, Options and Main Menu actions; keep the session paused while viewing options and apply gameplay changes only to the next match.
- [ ] Match `sample_result.png` with prominent points, duration, end reason and primary actions; keep registration status and pending retry accessible.
- [ ] Restyle the HUD and touch controls after `sample.png`, preserving semantic health/score/time and simultaneous movement/firing without covering the playable area.
- [ ] Validate focus trapping/restoration in dialogs, keyboard tab navigation and layouts in desktop, mobile portrait and landscape after the redesign.

### 14.5 Tile-based arena — Terra / Medium

- [ ] Use `tiles_sheet.png` or its retina alternative with correctly mapped grid frames for textured water, coastline, sand, grass and island interiors.
- [ ] Compose scenery closer to `sample.png` with available rocks, vegetation, docks/fortifications and nautical props; define which objects block movement and which are decorative.
- [ ] Make collision geometry match visible coastlines and obstacles; update enemy routing and spawn clearance for the resulting arena layout.
- [ ] Keep decorative art below gameplay sprites, preserve projectile contrast and avoid seams/texture bleeding during resizing.

### 14.6 Sprite atlases and animated feedback — Terra / Medium

- [ ] Load named textures from `ships_miscellaneous_sheet.xml` and its selected resolution; reuse atlas textures across ships, ship parts and effects.
- [ ] Use suitable ship/sail damage variants and supplied fire/explosion frames for damage, muzzle flash, impact and sinking feedback, with bounded debris and water ripples where supported by the artwork.
- [ ] Drive animation timing from match time so pause freezes combat effects; remove completed effects and prevent texture or ticker duplication across restarts.
- [ ] Add subtle sailing/wake feedback and readable cannonball trails where appropriate; respect reduced-motion preferences for decorative effects.

### 14.7 Supplied sound integration — Terra / Medium

- [ ] Add an audio adapter driven by gameplay/UI events; preload reusable buffers and unlock playback through the first user interaction on desktop and mobile.
- [ ] Use UI hover/click/open/close/back sounds and start/pause/resume/complete/game-over sounds at their corresponding transitions, once per event.
- [ ] Use cannon-fire variants, broadside, wood-hit, water-hit, collision, explosion and sinking sounds for the corresponding real combat events; document variation selection.
- [ ] Integrate ocean ambience and sailing loops plus score, low-health and time-warning cues; gate repeated warnings and limit overlapping voices to avoid clipping.
- [ ] Add persisted mute and volume controls in Options; pause/suspend loops when hidden or paused and release audio resources on exit without duplicate playback on restart.
- [ ] Handle audio loading/playback failures without blocking gameplay; verify every supplied sound has a mapped event or documented reason for exclusion.

### 14.8 Updated evidence and deployment — Terra / Medium

- [ ] Close the outstanding query consistency and pending-recovery tests in section 9 while preserving the redesigned logbook behavior.
- [ ] Add visual checks for textured projectiles, enlarged ships, tiled arena and all redesigned screens; inspect desktop/mobile snapshots against the supplied samples before approving baselines.
- [ ] Test asset-load failures, pause/resume of effects and audio, mute persistence, repeated navigation and simultaneous touch controls; check for unhandled browser errors.
- [ ] Repeat optimized-build profiling after atlas, scenery, effects and audio changes; record frame/entity samples and investigate resource retention over five cycles in the same page without reloads.
- [ ] Review earlier section 11/12 completion claims against retained evidence; record missing coverage and measurements instead of treating old checks as proof of the new version.
- [ ] Update asset/source documentation, controls, audio settings and known limitations; preserve measured performance evidence and generate the final test report.
- [ ] Have the user redeploy the reviewed commit, then verify https://pirate-battle-snowy.vercel.app/ including refresh, asset paths, MSW, logbook, mobile controls, audio and recovery flows.

Exit condition: all sample screens have functional counterparts with coherent supplied artwork; ships and cannonballs are readable, tiles and sprite effects participate in gameplay, audio is controllable, and the updated build has verified evidence before final submission.

## Suggested milestones

| Target | Milestone |
| --- | --- |
| First work session | Steps 0–4: setup, first deploy, PixiJS basics, moving ship and input |
| Next work session | Steps 5–7: complete local match; develop step 8 contracts alongside result data |
| Following work session | Steps 8–10: ranking/history, durable submission and failure scenarios |
| Final work session | Steps 11–13: coverage audit, profiling, documentation and final public verification |
| Two hours before deadline | Submission target; preserve remaining time for delivery issues |

Tests and documentation accompany implementation throughout; the final session audits and completes them. If a milestone slips, reassess immediately and remove only optional polish before considering any required-scope limitation, which must be documented honestly.
