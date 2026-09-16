# Supplied asset inventory

This inventory was created for the supplied `public/assets` directory on September 15, 2026. The pack contains 234 default PNGs, 234 retina PNGs, 27 WAV sounds, 8 sprite-sheet files, 3 tile-sheet files and 4 vector/reference files. The default and retina trees mirror each other; the retina files are the higher resolution presentation option.

| Family | Contents | Current runtime use | Planned use in the visual pass |
| --- | --- | --- | --- |
| `png/default/ships` and `png/retina/ships` | 24 ship variants plus six dinghies per resolution | `ship_1.png` player, `ship_2.png` Chaser, `ship_3.png` Shooter | Pick distinct silhouettes, larger presentation scale and damage variants. |
| `png/*/ship_parts` | Cannons, cannon ball, loose cannon, crews, flags, hulls, sails, wood and pole pieces | `cannon_ball.png` is loaded for projectile sprites | Use `cannon_ball.png` at readable scale and compose larger ships from hull/sail/flag parts where useful. |
| `png/*/effects` | Three explosion frames and two fire frames | No current runtime use | Animate muzzle, impact, explosion, fire and sinking feedback. |
| `png/*/tiles` | `tile_1.png` through `tile_96.png` per resolution | `tile_50.png` is used as the island rock | Map the 64×64 grid into water, shore, grass, rocks, docks and island details. |
| `png/*/ui` | Menu panel/title/buttons, round controls, HUD frames/fills/icons | No current runtime use | Build responsive menu, logbook, options, HUD and touch controls from real UI pieces. |
| `spritesheet` | `ships_miscellaneous_sheet` PNG/XML (normal and retina), `ui_sheet` JSON/PNG (normal and retina) | Not loaded yet | Prefer named atlas frames and retina selection to reduce duplicate texture loading. |
| `tilesheet` | `tiles_sheet.png`, retina PNG and `tilesheets.txt` | Not loaded yet | `tilesheets.txt` specifies a 64×64 grid with no margins. |
| `sounds` | 27 WAV cues for UI, weapons, impacts, ambience, sailing and match state | Not loaded yet | Map each cue to one gameplay or UI event, with mute/volume and lifecycle cleanup. |
| `vector` | Tile and miscellaneous-ship SVG sources | Not loaded yet | Reference or use when a scalable source is preferable; avoid loading a duplicate of an equivalent PNG. |
| Root references | `ui_scene_background.png`, `logo_jungle_gaming.svg`, `preview.png`, seven `sample_*.png` files | Samples are used during review only | Use the background/logo as decoration and treat samples as layout references, never as interactive screens. |

## Important dimensions and mappings

- `tilesheets.txt` defines 64×64 tiles with no spacing or margin.
- The miscellaneous ship atlas identifies `cannon_ball.png` as a 10×10 frame. Its transparent padding and small source size explain why a renderer scale of `0.35` makes the projectile hard to see.
- `ui_sheet.json` uses logical untrimmed coordinates; `ui_sheet_retina.json` has a 2× scale and a 2048×2048 source. Its metadata includes border and fill rectangles for stretchable panels and health bars.
- The ship atlas XML is a named frame map, not an animation timeline. Animation frame choices must be driven by gameplay time and cleaned up with the Pixi scene.

## Current coverage and ownership

`src/game/rendering/game-assets.ts` owns URL constants and Pixi texture loading. `FirstPlayableScene` currently loads five default PNGs: player ship, island rock, cannonball, Chaser ship and Shooter ship. No source asset is modified or converted. The remaining families are intentionally inventory-only until the visual/audio implementation is approved and profiled.
