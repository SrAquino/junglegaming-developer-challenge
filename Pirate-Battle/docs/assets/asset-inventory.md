# Supplied asset inventory

The supplied `public/assets` pack contains 234 default PNGs, 234 retina PNGs, 27 WAV files, sprite sheets, tile sheets, vectors and sample screens. Default and retina trees mirror each other; default assets are the current runtime selection.

| Family | Current runtime use | Remaining planned use |
| --- | --- | --- |
| Ships | `ship_1` is the player and menu preview; `ship_2` and `ship_3` are enemies. | Damage variants and additional silhouettes. |
| Ship parts | The atlas `cannon_ball.png` frame renders every projectile. | Hull, sail, flag and crew composition. |
| Effects | Atlas fire and explosion frames render muzzle flashes, impacts and explosions. | Timed variants, fire and sinking. |
| Tiles | Named 64 by 64 frames `tile_73` and `tile_50` are sliced from `tiles_sheet.png` for water and rocks. Direct exports `tile_68`, `tile_70`–`72` and `tile_60` provide island sand, vegetation and a pier. | Coastline and grass edge families, fortifications and additional props. |
| UI | Menu title/panel/buttons, touch controls, HUD icons, background and logo are used. | Additional HUD frames and tab art. |
| Spritesheet | `ships_miscellaneous_sheet.png` loads once; selected XML frames create combat textures. | Retina selection and additional named parts. |
| Tilesheet | `tiles_sheet.png` loads once and provides shared water and rock textures; transparent or repeating direct PNG exports compose the island without atlas-edge bleeding. | Map coastline and grass edge families for a less regular island silhouette. |
| Sounds | Match lifecycle, cannon, broadside, water/wood impact, explosion, ocean and sailing sounds are mapped. | UI, score, health, warning, collision and sinking cues. |
| Vectors | Reference only. | Use only if a scalable presentation source is needed. |
| Samples | Review references only. | Never render samples as product screens. |

## Important mappings

- `tilesheets.txt` defines 64 by 64 tiles with no margin.
- `png/default/tiles` contains the same grid as standalone PNG files. The arena currently maps sand `68`, plants `70`–`72` and pier `60`; matching retina files remain available for a later resolution-selection pass.
- `ships_miscellaneous_sheet.xml` defines `cannon_ball.png` as a 10 by 10 frame and names the fire/explosion frames used by the renderer.
- `ui_sheet.json` and its retina counterpart document stretchable UI components; direct PNG exports are used for responsive panels and buttons.
- The ship atlas is a named frame map, not an animation timeline. Frame choices must be driven by gameplay time and cleaned up with the Pixi scene.

## Ownership

`src/game/rendering/game-assets.ts` owns asset URLs, direct texture loading and named sprite atlas frames. `FirstPlayableScene` owns Pixi texture and sprite cleanup. `src/game/audio/game-audio.ts` owns HTML audio element lifecycle. No supplied asset is modified or converted.
