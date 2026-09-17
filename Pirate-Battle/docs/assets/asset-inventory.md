# Supplied asset inventory

The supplied `public/assets` pack contains 234 default PNGs, 234 retina PNGs, 27 WAV files, sprite sheets, tile sheets, vectors and sample screens. Default and retina trees mirror each other; default assets are the current runtime selection.

Updated against the current Tiled/audio implementation and `sample.png` on September 17, 2026. Integration means that a file is referenced by the implementation; runtime behavior is covered by the current [verification matrix](../reviews/2026-09-17/README.md) and checklist section 15.

| Family | Current runtime use | Remaining planned use |
| --- | --- | --- |
| Ships | White `ship_1/7/13` are the player's intact/damaged/critical stages; red `ship_3/9/15` identify Chasers; black `ship_2/8/14` identify Shooters. `ship_19/21/20` provide their sunk states. | The green, blue and yellow families (`4–6`, `10–12`, `16–18`, `22–24`) remain documented alternatives. |
| Ship parts | The named atlas frame `cannon_ball.png` renders every projectile; `wood_1`–`4` animate sinking debris. `cannon_loose` and three wood variants also appear as authored map decoration. | Hull, sail, flag and crew composition remains optional because complete ship variants cover the gameplay states. |
| Effects | Both fire frames and all three explosion frames animate muzzle, damage, impact and destruction feedback. Sunk ships and debris fade outward; bounded procedural wakes and projectile trails add motion cues. | Revisit timing only if device profiling identifies excessive overdraw. |
| Tiles | `public/maps/arena.tmj` selects and positions all water, land, fortification and decoration tiles from `tiles_sheet.png`. The runtime preserves its three authored tile layers. | Edit map content only in Tiled and retain the Collision object layer with matching geometry. |
| UI | Menu title/panel/buttons, six touch icons and all round button states, HUD health/counter frames, background and logo are used. HUD and 64px touch controls are overlaid inside the arena. | Consider amber/red HUD fills for health thresholds and settings/home icons where they improve navigation. |
| Spritesheet | `ships_miscellaneous_sheet.png` is loaded through the shared asset cache. `game-assets.ts` contains a typed frame manifest validated against the supplied XML for cannonball, fire, explosion and debris frames. | The identically mapped retina sheet is an explicit alternative and is not loaded alongside the default sheet. |
| Tilesheet | `tiles_sheet.png` loads once through the external `tiles_sheet.tsj`; tile GID flip flags, alpha, positions and layer order are interpreted at runtime. | The retina export remains an unloaded alternative pending measured benefit. |
| Sounds | All 27 WAV files have an event or deterministic variant mapping. Audio unlocks from a UI/control gesture, combat uses semantic simulation events, and loops/one-shots have bounded lifecycles. | Automated integration is complete; headed-device listening remains a delivery validation limitation rather than an unused asset. |
| Vectors | Reference only. | Use only if a scalable presentation source is needed. |
| Samples | Review references only. | Never render samples as product screens. |

## Important mappings

- `tilesheets.txt` defines 64 by 64 tiles with no margin.
- `png/default/tiles` contains the same grid as standalone PNG files. The arena currently maps fortification frames `13` and `15`, grass `39`, rocks `49`–`51`, pier/gate `60`, sand `68`, and plants `70`–`72`; matching retina files remain available for a later resolution-selection pass.
- `ships_miscellaneous_sheet.xml` defines the cannonball, fire, explosion and wood frames captured by the typed runtime manifest.
- `ui_sheet.json` and its retina counterpart document stretchable UI components; direct PNG exports are used for responsive panels and buttons.
- The ship atlas is a named frame map, not an animation timeline. Frame choices must be driven by gameplay time and cleaned up with the Pixi scene.

## Ownership

`src/game/rendering/game-assets.ts` owns asset URLs, direct texture loading and named sprite atlas frames. `FirstPlayableScene` owns Pixi texture and sprite cleanup. The app-scoped `GameAudio` owns HTML audio prototypes across screens; each game scene starts, suspends and ends its bounded voices and loops. No supplied asset is modified or converted.

## Sample-inspired composition and remaining material

The pack contains 96 tiles, 30 ship/dinghy images, 67 ship parts, five effects and 36 UI images at each resolution. Default tiles are 64×64; retina equivalents are alternative-resolution versions, not additional content.

| Material | Planned role and acceptance |
| --- | --- |
| Sand/grass coast families | The authored Tiled map composes the upper-left fortification island and lower landmasses from matching coastal corners and interiors. Their blocking contours come only from the Collision object layer. |
| Water and coast masks | `AguaRasa` supplies authored shallow-water bands below `Land`; it remains decorative and does not block movement or projectiles. |
| Wall/tower/pier tiles | Fortifications and piers are placed by `arena.tmj`; structures block only where matching Collision polygons were authored. |
| Rocks `49`–`51`, mossy rocks `65`–`67`, plants `70`–`72` | The `Decorations` layer varies coast detail without introducing implicit collision. Additional variants remain optional Tiled edits. |
| Sand-backed boat/cannon/wood tiles and standalone ship parts | Opaque sand-backed props remain restricted to compatible land. Transparent `dinghy_small_1`, `cannon_loose` and `wood_1`–`3` now decorate the south-east coast; all are nonblocking because the underlying land contour already blocks ships. |
| Hulls, sails and flags | All 24 complete ship sprites were reviewed as six color families with intact, damaged, critical and sunk artwork. White/red/black are assigned to player/Chaser/Shooter; modular construction remains an unused alternative. |
| HUD frames and fills | Match the sample's gold frames, top-left health and top-right score/time; clip fills to actual ratios and retain accessible HTML values. Use Pixi for health bars above ships. |
| Default/retina atlases and PNGs | Select one representation per asset/resolution; use retina where measured visual benefit warrants the cost. Validate scale, frame coordinates and filtering. |
| Vectors, samples, preview and unused variants | Retain provenance and document as sources, references or alternatives. No requirement to load every duplicate, recolor or vector into a match. |

## Sound event audit

All 27 WAVs are accounted for below. Automated browser checks cover mapping, UI unlock, mute/volume, variants, voice caps, pause/resume, failed playback and gesture recovery.

| Files | Current state | Required action |
| --- | --- | --- |
| `game_start`, `game_pause`, `game_resume`, `game_complete`, `game_over` | Lifecycle cues. Play unlocks before game start; pause/resume emit once and result cues are owned by the persistent app audio instance. | Automated mapping and lifecycle coverage complete. |
| `cannon_fire_1`–`3`, `cannon_broadside` | Front and enemy shots rotate through the three fire files; one broadside event plays once for the complete volley. | Complete. |
| `cannonball_water_hit_1`–`2`, `ship_wood_hit_1`–`2`, `ship_explosion_1`–`2` | Water, hull and destruction events rotate through their respective variants without using simulation randomness. | Complete. |
| `ship_sinking` | Plays once from each semantic ship-destroyed event alongside the explosion cue. | Complete. |
| `ocean_ambience_loop`, `ship_sailing_loop` | Ocean starts with an unlocked match; sailing runs only while player velocity is nonzero. Both pause and release with the session. | Automated lifecycle coverage exists; the current full-suite hidden-tab sailing check is recorded as failing in the September 17 review. |
| `ui_hover`, `ui_click`, `ui_open`, `ui_close`, `ui_back` | Delegated app UI cues; hover only plays after unlock and is throttled, while open/save/back receive distinct sounds. | Complete. |
| `score_point`, `health_low`, `time_warning`, `ship_collision` | Score, first low-health crossing, 30/10-second thresholds and new collision contacts emit gated cues. | Complete. |

The adapter uses reusable HTMLAudio prototypes and cloned voices rather than decoded Web Audio buffers. It tracks and caps one-shots at 12, owns loop instances separately, and releases `src` resources during pause/end/destroy. A failed `play()` releases that voice or loop; the next keyboard/touch gesture retries desired loops. Automated checks instrument browser media calls. Actual speaker volume and balance remain device-level validation and are not presented as an incomplete asset integration task.
