# Supplied asset inventory

The supplied `public/assets` pack contains 234 default PNGs, 234 retina PNGs, 27 WAV files, sprite sheets, tile sheets, vectors and sample screens. Default and retina trees mirror each other; default assets are the current runtime selection.

Reviewed against source commit `24237dc` and `sample.png` on September 16, 2026. Integration means that a file is referenced by the implementation; it does not establish correct event timing, visual fidelity or mobile usability. See [the audit](../reviews/2026-09-16/README.md) and checklist section 15 for acceptance steps.

| Family | Current runtime use | Remaining planned use |
| --- | --- | --- |
| Ships | `ship_1` is the player and menu preview; `ship_2` and `ship_3` are enemies. Damage currently changes tint. | Inspect the 24 ship sprites for readable faction/health variants; use selected dinghies as coastal or sinking props. |
| Ship parts | The atlas `cannon_ball.png` frame renders every projectile. | Hull, sail, flag and crew composition. |
| Effects | `fire_1`, `explosion_1` and `explosion_2` atlas frames render static, short-lived effects. | Timed variants using the five supplied effect images, sustained damage fire and sinking; wakes/trails/ripples may use bounded procedural rendering. |
| Tiles | Named 64 by 64 frames `tile_73` and `tile_50` are sliced from `tiles_sheet.png` for water and rocks. Direct exports `tile_1`–`3`, `17`, `19`, `33`–`35`, `39`, `68`, `70`–`72` and `60` compose the coastline, interior, vegetation and pier. | Fortifications and additional props. |
| UI | Menu title/panel/buttons, six touch icons and normal/pressed buttons, HUD icons, background and logo are used. Controls and HUD are currently outside the canvas. | `health_frame`, green/amber/red fills, `enemy_health_frame` and fills, `counter_panel`, round hover state and pause/settings/home icons as appropriate. Place gameplay controls inside the arena. |
| Spritesheet | `ships_miscellaneous_sheet.png` is loaded through the shared asset cache; four frames are manually hard-coded in `game-assets.ts`. XML is not parsed at runtime. | Validate named frame mappings against XML or generate a manifest; add selected damage/prop frames and a measured resolution policy. |
| Tilesheet | `tiles_sheet.png` loads once and provides shared water and rock textures; mapped direct PNG exports compose a three-by-three coastline plus sand and grass interiors without atlas-edge bleeding. | Add resolution-aware selection if profiling shows that retina screens need sharper scenery. |
| Sounds | 13 source names are mapped, including sinking; 14 are unmapped. The sinking source has no playback call. | Correct unlock/event/cleanup behavior, then wire UI, score, health, warning, collision, sinking and combat variants; details below. |
| Vectors | Reference only. | Use only if a scalable presentation source is needed. |
| Samples | Review references only. | Never render samples as product screens. |

## Important mappings

- `tilesheets.txt` defines 64 by 64 tiles with no margin.
- `png/default/tiles` contains the same grid as standalone PNG files. The arena maps coast corners and edges `1`–`3`, `17`, `19`, `33`–`35`, grass `39`, sand `68`, plants `70`–`72` and pier `60`; matching retina files remain available for a later resolution-selection pass.
- `ships_miscellaneous_sheet.xml` defines `cannon_ball.png` as a 10 by 10 frame and names the fire/explosion frames used by the renderer.
- `ui_sheet.json` and its retina counterpart document stretchable UI components; direct PNG exports are used for responsive panels and buttons.
- The ship atlas is a named frame map, not an animation timeline. Frame choices must be driven by gameplay time and cleaned up with the Pixi scene.

## Ownership

`src/game/rendering/game-assets.ts` owns asset URLs, direct texture loading and named sprite atlas frames. `FirstPlayableScene` owns Pixi texture and sprite cleanup. `src/game/audio/game-audio.ts` owns HTML audio element lifecycle. No supplied asset is modified or converted.

## Sample-inspired composition and remaining material

The pack contains 96 tiles, 30 ship/dinghy images, 67 ship parts, five effects and 36 UI images at each resolution. Default tiles are 64×64; retina equivalents are alternative-resolution versions, not additional content.

| Material | Planned role and acceptance |
| --- | --- |
| Sand/grass coast families | Compose large connected upper-left and lower landmasses with matching convex/concave corners and broad grassy interiors. The current 3×3 sand island and elliptical grass mask do not reproduce the sample. |
| Water and coast masks | Use a calmer apparent water scale and shallow-water bands around land; inspect mask families before tinting/compositing them. Keep shallow water decorative and make blocking land boundaries explicit. |
| Wall/tower/pier tiles | Build the upper-left fortification and a pier meeting the shoreline. Determine which parts are walk-blocking land decoration versus independent obstacles before adding collision. |
| Rocks `49`–`51`, mossy rocks `65`–`67`, plants `70`–`72` | Vary clusters along coasts and grass; maintain gameplay silhouettes and collision consistency. |
| Sand-backed boat/cannon/wood tiles and standalone ship parts | Put opaque sand-backed props only on compatible land. Use transparent dinghies, `cannon_loose`, `cannon_mobile`, `wood_1`–`4` and selected crew sprites for appropriate coastal/destruction details. |
| Hulls, sails and flags | Inspect the artwork before pairing health stages; alternate color/faction art is not automatically a damage animation. Full modular ship construction is optional if complete ship variants satisfy the effect requirement. |
| HUD frames and fills | Match the sample's gold frames, top-left health and top-right score/time; clip fills to actual ratios and retain accessible HTML values. Use Pixi for health bars above ships. |
| Default/retina atlases and PNGs | Select one representation per asset/resolution; use retina where measured visual benefit warrants the cost. Validate scale, frame coordinates and filtering. |
| Vectors, samples, preview and unused variants | Retain provenance and document as sources, references or alternatives. No requirement to load every duplicate, recolor or vector into a match. |

## Sound event audit

All 27 WAVs are accounted for below; mapped files still need playback acceptance checks.

| Files | Current state | Required action |
| --- | --- | --- |
| `game_start`, `game_pause`, `game_resume`, `game_complete`, `game_over` | Five mapped lifecycle sources. Start occurs before the canvas-only audio unlock. | Unlock from the initial Play/control gesture and verify exactly one cue per transition, including result-screen lifetime. |
| `cannon_fire_1`, `cannon_broadside` | Two mapped sources, called from projectile/effect sprite creation. | Trigger by actual weapon events; avoid playing both cues for every muzzle flash or once per broadside projectile. |
| `cannonball_water_hit_1`, `ship_wood_hit_1`, `ship_explosion_1` | Three mapped sources. | Verify real impact classification and bounded overlapping voices. |
| `ship_sinking` | One mapped source with no `play('sinking')` call. | Connect to sinking/destruction once, or explicitly exclude if there is no sinking phase. |
| `ocean_ambience_loop`, `ship_sailing_loop` | Two mapped loops start together after a canvas tap. | Unlock without empty-water taps, gate sailing on movement, pause/restore and release on exit. |
| `ui_hover`, `ui_click`, `ui_open`, `ui_close`, `ui_back` | Five unmapped sources. | Map meaningful UI transitions; hover is desktop-only and must not fire repeatedly from renders. |
| `score_point`, `health_low`, `time_warning`, `ship_collision` | Four unmapped sources. | Map actual score/threshold/collision events; gate repeat warnings and honor mute. |
| `cannon_fire_2`, `cannon_fire_3`, `cannonball_water_hit_2`, `ship_wood_hit_2`, `ship_explosion_2` | Five unmapped variants. | Define variation selection without changing simulation randomness, or document exclusions. |

The adapter uses reusable HTMLAudio prototypes and cloned voices, not decoded Web Audio buffers. `unlock()` currently sets a Boolean; actual browser playback permission still needs verification. One-shot clones are not tracked for cleanup or a global voice cap. Failed `play()` promises are caught, which prevents propagation but does not prove successful audio recovery.
