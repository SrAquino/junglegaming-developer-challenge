# Supplied asset inventory

The supplied `public/assets` pack contains 234 default PNGs, 234 retina PNGs, 27 WAV files, sprite sheets, tile sheets, vectors and sample screens. Default and retina trees mirror each other; default assets are the current runtime selection.

| Family | Current runtime use | Remaining planned use |
| --- | --- | --- |
| Ships | `ship_1` is the player and menu preview; `ship_2` and `ship_3` are enemies. | Damage variants and additional silhouettes. |
| Ship parts | The atlas `cannon_ball.png` frame renders every projectile. | Hull, sail, flag and crew composition. |
| Effects | Atlas fire and explosion frames render muzzle flashes, impacts and explosions. | Timed variants, fire and sinking. |
| Tiles | `tile_73` creates repeated water and `tile_50` decorates the central island. | Coastline, vegetation, docks and props. |
| UI | Menu title/panel/buttons, touch controls, HUD icons, background and logo are used. | Additional HUD frames and tab art. |
| Spritesheet | `ships_miscellaneous_sheet.png` loads once; selected XML frames create combat textures. | Retina selection and additional named parts. |
| Tilesheet | The 64 by 64 tile family is used via exported tile PNGs. | Migrate scenery to sliced `tiles_sheet.png` frames when completing the full map. |
| Sounds | Match lifecycle, cannon, broadside, water/wood impact, explosion, ocean and sailing sounds are mapped. | UI, score, health, warning, collision and sinking cues. |
| Vectors | Reference only. | Use only if a scalable presentation source is needed. |
| Samples | Review references only. | Never render samples as product screens. |

## Important mappings

- `tilesheets.txt` defines 64 by 64 tiles with no margin.
- `ships_miscellaneous_sheet.xml` defines `cannon_ball.png` as a 10 by 10 frame and names the fire/explosion frames used by the renderer.
- `ui_sheet.json` and its retina counterpart document stretchable UI components; direct PNG exports are used for responsive panels and buttons.
- The ship atlas is a named frame map, not an animation timeline. Frame choices must be driven by gameplay time and cleaned up with the Pixi scene.

## Ownership

`src/game/rendering/game-assets.ts` owns asset URLs, direct texture loading and named sprite atlas frames. `FirstPlayableScene` owns Pixi texture and sprite cleanup. `src/game/audio/game-audio.ts` owns HTML audio element lifecycle. No supplied asset is modified or converted.
