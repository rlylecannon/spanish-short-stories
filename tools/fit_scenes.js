#!/usr/bin/env node
/* Crop each scene to its content: renders without background, finds the bounding box with ImageMagick, writes "vb" (4:3) into art/scenes-*.json */
/* NOTES
   Inputs/outputs: reads AND REWRITES every art/scenes-*.json in place (only each scene's "vb" is set; the files are re-serialised
   with JSON.stringify(..., null, 1), so formatting may change). Scratch PNG/SVG files go to /tmp/fit.
   Usage: node tools/fit_scenes.js [PAD]     PAD = padding in px around the content, default 26. Paths are relative to this file.
   Requires ImageMagick `convert` (used for rendering and for trimming).
   Safe to re-run: yes in the sense that it is deterministic and idempotent for the same PAD (an existing "vb" is ignored and
   recomputed), but it OVERWRITES any hand-tuned "vb" in every scene file, so back up art/ first if some were set manually.
   Caveat: a convert failure throws (execSync) and stops the run part-way, before the current file is written back. */
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const Art = require('../art/art.js');
const dir = path.join(__dirname, '..', 'art'), tmp = '/tmp/fit'; fs.mkdirSync(tmp, { recursive: true });
const PAD = +process.argv[2] || 26;
for (const f of fs.readdirSync(dir).filter(f => /^scenes-.*\.json$/.test(f))) {
  const sc = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  for (const id of Object.keys(sc)) {
    // Render the scene alone (no wall/ground, no existing vb, solid-fill mode), then find the non-white bounding box:
    // -fuzz 2% -trim crops to content and %w %h %X %Y print its size and offset ("+x+y"), parsed by the regex below.
    const spec = Object.assign({}, sc[id]); delete spec.vb;
    const svg = Art.scene(Object.assign({}, spec, { bg: false, ground: false }), { simple: true });
    fs.writeFileSync(`${tmp}/${id}.svg`, svg);
    execSync(`convert -density 96 ${tmp}/${id}.svg -background white -flatten ${tmp}/${id}.png`);
    const g = execSync(`convert ${tmp}/${id}.png -fuzz 2% -trim -format "%w %h %X %Y" info:`).toString().trim().match(/(\d+) (\d+) \+?(-?\d+) \+?(-?\d+)/);
    let [bw, bh, bx, by] = g.slice(1).map(Number);
    // Viewbox size: content plus PAD on each side, widened as needed to keep a 4:3 ratio, capped at the full 400x300 canvas;
    // then centred on the content box.
    let w = Math.max(bw + 2 * PAD, (bh + 2 * PAD) * 4 / 3), h = w * 3 / 4;
    if (w > 400) { w = 400; h = 300; }
    let x = bx + bw / 2 - w / 2, y = by + bh / 2 - h / 2;
    // keep the ground strip in view: bias toward the bottom
    y = Math.min(y + 12, 300 - h);
    x = Math.max(0, Math.min(400 - w, x)); y = Math.max(0, y);
    sc[id].vb = [x, y, w, h].map(v => Math.round(v * 10) / 10);
  }
  fs.writeFileSync(path.join(dir, f), JSON.stringify(sc, null, 1));
}
console.log('fitted');
