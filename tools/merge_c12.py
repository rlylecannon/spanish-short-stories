# ONE-OFF MERGE SCRIPT (first import of the C1/C2 stories). Not a routine build step.
# PURPOSE: import the 20 new C1/C2 stories and their companion data (grammar, grammar quiz, dialogues, partners, goals,
#   quiz categories) from new-stories/c12/W*.json into the main data files.
# INPUT FILE SHAPE (each W*.json): {"stories": [...], "grammar": {id: [...]}, "gq": {id: [...]}, "dialogues": {id: {...}},
#   "partners": {id: ...}, "goals": {id: ...}, optional "categories_add": {topic: category}}.
# INPUTS (paths relative to the CURRENT DIRECTORY, so run from the project root): stories/all-stories.json, new-stories/c12/W*.json,
#   dialogues/partners.json, dialogues/goals.json, grammar-quiz/{categories.json,all-gq.json}, dialogues/all-dialogues.json.
# OUTPUTS (rewritten in place, indent=1): stories/all-stories.json, grammar/c1.json, grammar/c2.json, grammar-quiz/all-gq.json,
#   grammar-quiz/gq-c1.json, gq-c2.json, dialogues/all-dialogues.json, dialogues/dialogues-c1.json, dialogues-c2.json,
#   dialogues/partners.json, dialogues/goals.json, grammar-quiz/categories.json.
# USAGE: python3 tools/merge_c12.py
# SAFE TO RE-RUN: NO. It keeps only the existing A1-B2 stories and REPLACES all C1/C2 stories with the ones from
#   new-stories/c12 (grammar/c1.json and c2.json are rebuilt from scratch from those files, and gq/dialogue entries for those ids
#   are overwritten), so every later edit to C1/C2 content, e.g. what tools/apply_review_c12.py applied, is discarded.
#   Back up first. It asserts that exactly 20 new stories were found and stops before writing if not.
import json,glob
# L = load JSON (UTF-8); W = write JSON (keeps non-ASCII, 1-space indent).
def L(p): return json.load(open(p,encoding='utf-8'))
def W(p,d): json.dump(d,open(p,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
# st = existing stories to KEEP (A1-B2 only; old C1/C2 entries are dropped here). G/Q/D collect the new C1/C2 grammar, quiz
# and dialogue data; P, GO and cat start from the current files and get the new entries added.
st=[s for s in L('stories/all-stories.json') if s['level'] in('A1','A2','B1','B2')]
G={'c1':{},'c2':{}};Q={};D={};P=L('dialogues/partners.json');GO=L('dialogues/goals.json');cat=L('grammar-quiz/categories.json')
new=[]
# Gather every worker file in name order (grammar sets are filed under 'c1'/'c2' by the first two characters of the story id).
for f in sorted(glob.glob('new-stories/c12/W*.json')):
    t=L(f); new+=t['stories']
    for i,g in t['grammar'].items(): G[i[:2]][i]=g
    Q.update(t['gq']); D.update({i:d for i,d in t['dialogues'].items()}); P.update(t['partners']); GO.update(t['goals']); cat.update(t.get('categories_add',{}))
# Write phase: the 20-story assert comes first, so a wrong count aborts before anything is written. The all-* files are
# merged by key (other levels untouched); grammar and the per-level c1/c2 gq and dialogue files are written whole.
new.sort(key=lambda s:s['id']); assert len(new)==20,len(new)
W('stories/all-stories.json',st+new)
for lv in G: W(f'grammar/{lv}.json',dict(sorted(G[lv].items())))
allq=L('grammar-quiz/all-gq.json'); allq.update(Q); W('grammar-quiz/all-gq.json',allq)
for lv in('c1','c2'): W(f'grammar-quiz/gq-{lv}.json',{k:v for k,v in sorted(Q.items()) if k.startswith(lv)})
alld=L('dialogues/all-dialogues.json'); alld.update(D); W('dialogues/all-dialogues.json',alld)
for lv in('c1','c2'): W(f'dialogues/dialogues-{lv}.json',{k:v for k,v in sorted(D.items()) if k.startswith(lv)})
W('dialogues/partners.json',P); W('dialogues/goals.json',GO); W('grammar-quiz/categories.json',cat)
print(len(st+new),'stories;',sum(len(s) for s in G.values()),'grammar sets')
