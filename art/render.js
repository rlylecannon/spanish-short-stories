#!/usr/bin/env node
/* usage: node render.js scenes.json outDir
   scenes.json = { "a1-01": {items:[...]} , ... }  ->  outDir/<id>.svg and <id>.png (via ImageMagick), plus outDir/sheet.png contact sheet */
/* NOTES
   Purpose: batch-render scene JSON to files for print use; tools/build_pdfs.py calls it to make the PNG illustrations for
   the PDFs (it passes /tmp/pdf-art/scenes.json and /tmp/pdf-art/png).
   Inputs: argv[2] = scenes JSON file ({ "<story id>": scene spec }, see art/art.js for the schema), argv[3] = output directory
   (created if missing; both are required, there is no argument check).
   Outputs: <id>.svg, <id>.png per scene, and sheet.png (a contact sheet) when there is more than one scene.
   Requires: node and ImageMagick (`convert`; `montage` is preferred for the sheet). Safe to re-run: it only writes into outDir.
   Caveat: a failed PNG conversion is only logged ("convert failed for <id>"), and the sheet step silently ignores errors. */
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const Art = require('./art.js');
const [,, file, out] = process.argv;
const scenes = JSON.parse(fs.readFileSync(file, 'utf8'));
fs.mkdirSync(out, { recursive: true });
const ids = Object.keys(scenes);
for (const id of ids) {
  // simple:true = solid fills only (no halftone patterns or SVG filters), the mode meant for rasterising for print.
  const svg = Art.scene(scenes[id], { simple: true });
  fs.writeFileSync(path.join(out, id + '.svg'), svg);
  // SVG -> PNG with ImageMagick, flattened onto white so transparent areas do not become black.
  try { execSync(`convert -density 96 "${path.join(out, id + '.svg')}" -background white -flatten "${path.join(out, id + '.png')}"`); }
  catch (e) { console.error('convert failed for', id); }
}
// Contact sheet: 3 columns of 400x300 tiles via montage; if montage fails, fall back to one horizontal strip with convert +append.
if (ids.length > 1) {
  try { execSync(`cd "${out}" && montage ${ids.map(i => i + '.png').join(' ')} -tile 3x -geometry 400x300+6+6 -label '%t' sheet.png 2>/dev/null || convert ${ids.map(i => i + '.png').join(' ')} +append sheet.png`); } catch (e) {}
}
console.log('rendered', ids.length, 'scene(s) to', out);
