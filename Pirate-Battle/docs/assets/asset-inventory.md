# Supplied asset inventory

The supplied `public/assets` pack contains 234 default PNGs, 234 retina PNGs, 27 WAV files, sprite sheets, tile sheets, vectors and sample screens. Default and retina trees mirror each other; default assets are the current runtime selection.

Reviewed against source commit `24237dc` and `sample.png` on September 16, 2026. Integration means that a file is referenced by the implementation; it does not establish correct event timing, visual fidelity or mobile usability. See [the audit](../reviews/2026-09-16/README.md) and checklist section 15 for acceptance steps.

| Family | Current runtime use | Remaining planned use |
| --- | --- | --- |
| Ships | White `ship_1/7/13` are the player's intact/damaged/critical stages; red `ship_3/9/15` identify Chasers; black `ship_2/8/14` identify Shooters. `ship_19/21/20` provide their sunk states. | The green, blue and yellow families (`4–6`, `10–12`, `16–18`, `22–24`) remain documented alternatives. |
| Ship parts | The named atlas frame `cannon_ball.png` renders every projectile; `wood_1`–`4` animate sinking debris. `cannon_loose` and three wood variants also appear as authored map decoration. | Hull, sail, flag and crew composition remains optional because complete ship variants cover the gameplay states. |
| Effects | Both fire frames and all three explosion frames animate muzzle, damage, impact and destruction feedback. Sunk ships and debris fade outward; bounded procedural wakes and projectile trails add motion cues. | Revisit timing only if device profiling identifies excessive overdraw. |
| Tiles | `public/maps/arena.tmj` selects and positions all water, land, fortification and decoration tiles from `tiles_sheet.png`. The runtime preserves its three authored tile layers. | Edit map content only in Tiled and retain the Collision object layer with matching geometry. |
| UI | Menu title/panel/buttons, six touch icons and all round button states, HUD health/counter frames, background and logo are used. HUD and 64px touch controls are overlaid inside the arena. | Consider amber/red HUD fills for health thresholds and settings/home icons where they improve navigation. |
| Spritesheet | `ships_miscellaneous_sheet.png` is loaded through the shared asset cache. `game-assets.ts` contains a typed frame manifest validated against the supplied XML for cannonball, fire, explosion and debris frames. | The identically mapped retina sheet is an explicit alternative and is not loaded alongside the default sheet. |
| Tilesheet | `tiles_sheet.png` loads once through the external `tiles_sheet.tsj`; tile GID flip flags, alpha, positions and layer order are interpreted at runtime. | The retina export remains an unloaded alternative pending measured benefit. |
| Sounds | 13 source names are mapped, including sinking; 14 are unmapped. Sinking now plays when its visual effect is created. | Correct unlock/event/cleanup behavior, then wire UI, score, health, warning, collision and combat variants; details below. |
| Vectors | Reference only. | Use only if a scalable presentation source is needed. |
| Samples | Review references only. | Never render samples as product screens. |

## Important mappings

- `tilesheets.txt` defines 64 by 64 tiles with no margin.
- `png/default/tiles` contains the same grid as standalone PNG files. The arena currently maps fortification frames `13` and `15`, grass `39`, rocks `49`–`51`, pier/gate `60`, sand `68`, and plants `70`–`72`; matching retina files remain available for a later resolution-selection pass.
- `ships_miscellaneous_sheet.xml` defines the cannonball, fire, explosion and wood frames captured by the typed runtime manifest.
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
| Sand-backed boat/cannon/wood tiles and standalone ship parts | Opaque sand-backed props remain restricted to compatible land. Transparent `dinghy_small_1`, `cannon_loose` and `wood_1`–`3` now decorate the south-east coast; all are nonblocking because the underlying land contour already blocks ships. |
| Hulls, sails and flags | All 24 complete ship sprites were reviewed as six color families with intact, damaged, critical and sunk artwork. White/red/black are assigned to player/Chaser/Shooter; modular construction remains an unused alternative. |
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
| `ship_sinking` | Mapped and called once when each renderer-visible sinking effect is created. | Verify playback unlock and voice cleanup with the rest of section 15.5. |
| `ocean_ambience_loop`, `ship_sailing_loop` | Two mapped loops start together after a canvas tap. | Unlock without empty-water taps, gate sailing on movement, pause/restore and release on exit. |
| `ui_hover`, `ui_click`, `ui_open`, `ui_close`, `ui_back` | Five unmapped sources. | Map meaningful UI transitions; hover is desktop-only and must not fire repeatedly from renders. |
| `score_point`, `health_low`, `time_warning`, `ship_collision` | Four unmapped sources. | Map actual score/threshold/collision events; gate repeat warnings and honor mute. |
| `cannon_fire_2`, `cannon_fire_3`, `cannonball_water_hit_2`, `ship_wood_hit_2`, `ship_explosion_2` | Five unmapped variants. | Define variation selection without changing simulation randomness, or document exclusions. |

The adapter uses reusable HTMLAudio prototypes and cloned voices, not decoded Web Audio buffers. `unlock()` currently sets a Boolean; actual browser playback permission still needs verification. One-shot clones are not tracked for cleanup or a global voice cap. Failed `play()` promises are caught, which prevents propagation but does not prove successful audio recovery.
