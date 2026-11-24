# Props library (v3)
`web/props.js` exports `makeProps(ctx)`; main.js builds it once and the story positions/shows things via `worldAt`/`worldState`.
`ctx = { THREE, add, box, tbox, M, P, world, scene, boardMat, crateMat }` (all defined in main.js before the call).

| builder | returns | notes |
|---|---|---|
| `signGroup(lines, bg, fg, w, h, bw, bh)` | Group | painted wooden sign on two posts; `lines = [[text, px], ...]`; texture from `P.board` |
| `barn(x, z, rotY)` / `house(x, z, rotY)` / `tank(x, z)` | Group | outback farm set: corrugated-roof barn, farmhouse with verandah, water tank |
| `makeWindmill(x, z)` | `{ mill, wheel }` | spin `wheel.rotation.z` per frame |
| `gum(x, z, h)` | Group | ghost gum tree (trunk + four foliage blobs) |
| `makeTruck()` | `{ truck, wheels }` | 1930s army truck, front toward +x, starts hidden; spin `wheels[i].rotation.z` |
| `makeGun()` | Group | Lewis gun on a tripod, barrel along +x, starts hidden |
| `makeCrates()` | Group | three stacked "10,000 AMMO" crates (needs `crateMat`), starts hidden |
| `makeBullets()` | `{ bullets, bulletGrp }` | ten standing rounds; story shows them one by one |

Materials used (in `M`): wood, post, wire, dark, brass, truck/truckDark/glass/tire/hub, gunIron/gunDark/stock, shell/lead, barn/iron*/plaster/trunk, leaf/leaf2, white, tankGrey.
Painters (paint.js): `wheat, redDirt, corrugated, barnWood, canvasCover, trunk, board(lines,bg,fg,w,h), crate(text)`.
Cast (aussie.js): outfits gunner/gunnerB/gunnerC/major/farmA/B/C, `slouchHat`, side-view `emuSide`, fx `fxCoin/fxTally/fxRifle/fxFlash/fxZip`.

To add a new prop: write a builder in props.js that only creates geometry (use `add`/`tbox`/`box`, set `visible=false` if the story shows it), return it from `makeProps`, then document it here.
