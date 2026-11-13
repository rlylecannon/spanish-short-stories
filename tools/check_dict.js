/* check_dict.js: one-off dictionary QA. Merges the per-batch dictionary output files and checks that every verb reading can be
   matched by the conjugation engine (site-src/conj.js), listing the ones it cannot.
   Inputs (paths relative to the CURRENT DIRECTORY, so run from the project root): dict/out-<1..6>-*.json. Each file maps a
   surface form to a list of readings; a reading is an array [lemma, part of speech, ...], and only readings whose
   second item is 'verb' are checked.
   Outputs: dict/merged.json (all batches merged by form; later files overwrite earlier ones) and dict/unmatched.json
   ([[form, lemma], ...] that Conj.identify() did not recognise); it also prints counts and the first 80 unmatched pairs
   as "form>lemma". It does not touch dict/dict.json.
   Usage: node tools/check_dict.js     Safe to re-run: yes (it only overwrites merged.json and unmatched.json).
   Caveat: the lemma is passed to identify() with a trailing "se" stripped, so reflexive infinitives are checked as plain verbs. */
const fs=require('fs'),C=require('../site-src/conj.js');
// d: merge every out-<level digit>-* file in dict/ (the 1..6 are batch numbers in the file names) into one {form: [readings]} object.
const d={};for(let i=1;i<=6;i++)for(const f of fs.readdirSync('dict').filter(x=>x.startsWith('out-'+i+'-')))Object.assign(d,JSON.parse(fs.readFileSync('dict/'+f,'utf8')));
// Count verb readings (v), those the engine recognises (ok), and collect the rest in bad as [form, lemma].
// C.identify(infinitive, form) returns the list of tense/person matches for that form (empty = not recognised).
fs.writeFileSync('dict/merged.json',JSON.stringify(d));
let bad=[],v=0,ok=0;
for(const [w,rs] of Object.entries(d))for(const r of rs){ if(r[1]!=='verb')continue; v++;
  const m=C.identify(r[0].replace(/se$/,''),w); if(m.length)ok++; else bad.push([w,r[0]]);}
console.log('forms',Object.keys(d).length,'verb readings',v,'matched',ok,'unmatched',bad.length);
fs.writeFileSync('dict/unmatched.json',JSON.stringify(bad));
console.log(bad.slice(0,80).map(x=>x.join('>')).join('  '));
