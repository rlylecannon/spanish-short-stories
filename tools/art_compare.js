/* art_compare.js: one-off review helper that builds side-by-side HTML contact pages to eyeball the country ink pairs.
   Purpose: show reference scenes (A1-B2) next to C1/C2 scenes (rows grouped by country), and C1/C2 "before" vs "after"
   the flag-colour inks change.
   Inputs: art/scenes-{a1,a2,b1,b2,c1,c2}.json and _bak/scenes-{c1,c2}.before-flag.json (the pre-change backups).
   Outputs: docs/art-compare-1.html .. art-compare-4.html (the docs/ folder must already exist; the files are overwritten).
   Usage: node tools/art_compare.js   (paths are relative to this file, so the current directory does not matter).
   Safe to re-run: yes, it only overwrites those four pages. It fails with ENOENT if the _bak files are missing.
   Caveats: the country rows and scene ids in `rows` and in the "before/after" lists are hard-coded for that review, and
   the unused variable `ba` is leftover from an earlier layout. */
const fs=require('fs');const Art=require('../art/art.js');const R=__dirname+'/../art/';
// all: every scene keyed by story id, merged from the six level files.
const all={};for(const f of ['a1','a2','b1','b2','c1','c2'])Object.assign(all,JSON.parse(fs.readFileSync(R+`scenes-${f}.json`)));
// oldAll: the C1/C2 scenes as they were before the flag-ink change (backups in _bak/).
const oldAll={};for(const f of ['c1','c2'])Object.assign(oldAll,JSON.parse(fs.readFileSync(__dirname+`/../_bak/scenes-${f}.before-flag.json`)));
// rows: [country, [scene ids to show]]. cell(): one captioned figure rendered with the hand-drawn (fx) look; scenes flagged
// `flat` in their JSON use the flat renderer.
const rows=[['Mexico',['a1-01','c1-07','c2-06']],['Chile',['b2-01','c1-06']],['Spain',['a1-03','c1-02','c2-01']],['Uruguay',['b1-02','c2-02']],['Peru',['a2-03','c2-10']],['Colombia',['a1-04','c2-08']]];
const cell=(id,s,cap)=>`<figure><div class="im">${Art.scene(s,{fx:true,flat:!!s.flat})}</div><figcaption>${cap}</figcaption></figure>`;
const head=`<!doctype html><meta charset="utf-8"><title>Art compare</title><style>body{font:12px system-ui;margin:10px;background:#faf9f7;color:#1d1d1d}h2{margin:10px 0 4px;font-size:15px}h1{font-size:17px;margin:0 0 6px}h3{margin:6px 0}.g{display:flex;gap:14px;flex-wrap:wrap}figure{margin:0;width:170px}.im svg{width:170px;height:auto;display:block;border-radius:10px;background:#efe6d3}figcaption{font-size:12px;margin-top:4px;color:#555}</style><h1>Country ink check: A1–B2 vs C1/C2</h1>`;
// head: shared page header + CSS. pages[i]: HTML for row i, captioned "(new inks)" for c-level ids and "(reference)" otherwise.
let pages=[];for(const [c,ids] of rows){pages.push(`<h2>${c}</h2><div class="g">`+ids.map(id=>cell(id,all[id],`${id}${id[0]=='c'?' (new inks)':' (reference)'}`)).join('')+`</div>`)}
let ba=`<h2>Before and after (C1/C2)</h2><div class="g">`;


// Write the four pages: 1-3 pair up the country rows; 4 shows before/after for selected C1/C2 scenes (pair() = old render, new render).
const out=__dirname+'/../docs/';
const mk=(name,body)=>fs.writeFileSync(out+name,head+body);
mk('art-compare-1.html','<h1>A1–B2 reference vs C1/C2 (new flag inks)</h1>'+pages[0]+pages[1]);
mk('art-compare-2.html',pages[2]+pages[3]);
mk('art-compare-3.html',pages[4]+pages[5]);
const pair=ids=>`<div class="g">`+ids.map(id=>cell(id,oldAll[id],`${id} before`)+cell(id,all[id],`${id} after (${all[id].country})`)).join('')+`</div>`;
mk('art-compare-4.html','<h1>C1/C2 before and after</h1>'+pair(['c1-01','c1-03'])+pair(['c1-08','c2-05'])+pair(['c2-07']));
console.log('ok');
