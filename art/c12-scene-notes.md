# C1/C2 scene notes (scenes-c1.json, scenes-c2.json)

All 20 specs use multi-ink (`inks`; `inks[1]` is a warm brown so that dark skins print as an even brown halftone) and the new opt-in flag `dots1: true`. The renderer was extended in `art/art.js` (backup: `_bak/art.before-c12.js`). The 40 existing scenes (a1–b2) and test.json give byte-identical SVG in default, simple, fx and flat modes, and so do 66 avatar variants.

**Renderer additions (opt-in only):**
- **Props:** 79 new props. Props now receive their item, so a few take `v`, `w`, `h` or `skin` options.
- **Person:** hair `fade`, `locs`, `puff`, `wrap` (`wrapc`). Acc `hardhat` (`hatc`), `hivis`, `lifevest`, `wig`, `gloves`, `sing`, `eyesclosed`, `earrings`, `flowers`. Outfits `guayabera`, `scrubs`, `blazer`. Poses `whistle`, `dance`. `sit:true`, which lets any pose sit. Seats `rocker`, `cajon`, `step`. `pants` colour override.
- **Ink:** `spec.dots1` defines the missing ink-B halftone pattern. Without it, colours that map to ink B (the shaded side of light skin, wood) reference an undefined pattern and vanish in multi-ink scenes. This is an old latent bug, left untouched for the old scenes.

| id | depicted | new props used | known limitations |
|---|---|---|---|
| c1-01 | Rainy Almirante dock: Yarisel (dark skin, braids, hi-vis, tablet), Lionel (grey fade, yellow rain jacket), two red-cross cold boxes, blue water taxi, ferry behind | coolbox, watertaxi, water, dock, ferry, tablet; hivis | Ferry is small and stylised; no dusk light |
| c1-02 | La Gomera: Chano whistling (finger to mouth) on a stone mirador, Íñigo in a city jacket with notebook, cloth table with cheeses and one empty plate, terraces, Teide | terraces, stonewall, clothtable, cheese, plate, notebook; pose whistle | The whistle gesture is small at thumbnail size |
| c1-03 | Curiepe night: Mariángel pointing at the fermentation box with cacao pods, Críspulo at a pot over a wood fire, Yonaiker carrying a long culo e' puya drum, church | fermentbox, cacao, fire, longdrum, church | No phone torch or crowd in white; it does not read as night (paper background) |
| c1-04 | Mangrove: Wilmer in a canoe with life jacket and calliper over a black cockle, Ermelinda in a headwrap with basket among mangrove roots | canoe, mangrove, calliper, cockle, water; lifevest, wrap | Cleared shrimp-farm bank is not shown; calliper is small |
| c1-05 | Radio booth: Dionisio seated in headphones facing the console, Keyla holding a tape reel up, hand-painted sign, palm in the window, garaon drum | mixer, reel, garaon, sign, palm | No stilts/beach exterior (interior view) |
| c1-06 | Chiloé minga: shingled house on barrels towed by two boats (tow lines), Belarmino on its porch, Javiera in hard hat with tablet on the quay, ox | floathouse, fishboat, water, tablet, ox; hardhat | Crowd is left out; only one ox; Belarmino is small |
| c1-07 | Cuajinicuilapa patio: doña Eufemia (white hair) in a rocking chair holding a horned devil mask, Itandehui in census vest with tablet, Baltazar by the round thatched house | roundhouse, devilmask, tablet; seat rocker, hivis | Census vest is drawn as a hi-vis vest |
| c1-08 | Potosí lab: Ofelia (gloves, glasses, loupe), macuquina coin on velvet, precision scale, Wara with a waveform on her laptop, Cerro Rico in an arched window | coin, velvet, scale, loupe, archwindow (v:cerro), laptopv (v:wave); gloves | Coin detail is only legible at large size |
| c1-09 | Archive: Ezequiel in cotton gloves over a huge open ledger, laptop video call with Altagracia, schooner drawing pinned above, arched window over the bay | ledger, laptopv (v:call), schoonerpic, archwindow (v:bay) | Faces in the video-call window are a tiny generic head |
| c1-10 | Gaiman tea house: black cake, teapot and bilingual notebook on a lace table, Brígida (apron) facing Ceferino with Lautaro (suit, glasses) between, red dragon, bare poplars in the window | blackcake, teapot, notebook, dragon, archwindow (v:poplars), clothtable | Dragon is a simple silhouette; no wood panelling |
| c2-01 | Cádiz backstage: Reyes (grey bob, glasses) with a phone sound-wave and notebook, two chirigoteros dressed as judges in wigs and gowns, bulb-lit mirror, bass drum and kazoo on a chair, confetti | phonewave, mirror, bassdrum, kazoo, confetti; wig | Theatre red/gold is only in accents |
| c2-02 | Barrio Sur night: Obdulio on a doorstep beside the open piano drum with handwriting inside, street fire, Abigail with a drum on a strap, façade and lights | tamboril (v:open), fire, facade, stringlights; seat step, puff | Names inside the drum are suggestive marks, not readable |
| c2-03 | Academy kitchen: Anacleto lifting the lid of a big caldero, Wilkin with a tray, Courtney with a tablet, window with chain-link fence, the boy outside and a guloya costume | caldero, lid, tray, fencewindow | The guloya dancer is a small orange figure only |
| c2-04 | Tocaña: Simona (braids, white hard hat, rolled plan), Jacinta in a red headwrap singing, saya drummer with bombo, green terraces and mist | terraces, plans, bombo; wrap, sing | No village plaza; the mist is a single cloud |
| c2-05 | Joya de Cerén: Neftalí (khaki, hat) showing a phone photo of the pot, Yesenia with tablet and trowel, protective tin roof, adobe remains, ash-layer trench, maize | shelter, trench, adobe, phonepic, trowel, maize | The trench reads more like a low earth bank |
| c2-06 | Yanga fandango: two women dancing on the tarima, Ruperto with a jarana, don Fidencio singing with eyes closed, Yanga statue, covered plaque on a stand, lamps | tarima, statue, plaque, stringlights; dance, sing, eyesclosed | Jarana is the generic guitar scaled down; statue is small |
| c2-07 | Asunción courtroom: Perla in headphones with a waveform laptop, the elderly witness in a flowered dress, judge's bench, Paraguayan flag, evidence board with burnt-cane photo, ceiling fan | judgebench, pyflag, board, fan, laptopv (v:wave); flowers | Flag emblem is a dot; no judge figure |
| c2-08 | Palenque at dusk: Dorina (headwrap) seated with a recorder, uncle Evaristo seated, tall visitor Kiese standing, drums against a whitewashed wall, Benkos Biohó statue breaking chains | whitewall, garaon, recorder, statue (v:chains); wrap, sit:true | Dusk is not shown (paper background) |
| c2-09 | Cimadevilla flat: Covadonga in teal scrubs with headphones, cassette recorder, box of tapes, sepia children photo, tea-glass holder, window to the grey sea, lamp | cassette, tapebox, photo, teaglass; scrubs | The ship in the photo is only implied (row of heads) |
| c2-10 | El Carmen: don Anselmo (white hair, straw hat) on a cajón, Zoila (blazer, red scarf) with field notebook and phone playing the track, cousin filming, cotton plants, adobe hacienda | cajon (seat), cotton, hacienda, phonewave | Zoila's afro puff is large at thumbnail size |

General limitations:
- People are the renderer's single stock figure, so ages show only through grey or white hair, canes and glasses.
- Seated figures always face right unless flipped.
- The PNG previews here were made with ImageMagick, which ignores CSS line styling, so the browser output has finer outlines.
