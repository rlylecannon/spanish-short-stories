# ONE-OFF EDIT SCRIPT (review pass over the C1/C2 stories). Not a routine build step.
# PURPOSE: apply reviewers' find/replace patches from new-stories/c12/review/R*.json to the C1/C2 content, then write back.
# PATCH SHAPE: {"patches": [{"file": stories|grammar|gq|dialogues|partners|goals, "id": story id, "find": text, "replace": text}]}.
# HOW A PATCH WORKS: the target object is serialised with json.dumps(ensure_ascii=False); `find` must occur EXACTLY ONCE in that
#   text (so it is matched against JSON-escaped text, e.g. quotes appear as \"); it is replaced and the result parsed back.
#   "grammar" patches only look in grammar/c1.json and c2.json (chosen by the first two characters of the id).
# INPUTS (paths relative to the CURRENT DIRECTORY, so run from the project root): stories/all-stories.json, grammar/c1.json,
#   grammar/c2.json, grammar-quiz/all-gq.json, dialogues/{all-dialogues,partners,goals}.json, new-stories/c12/review/R*.json.
# OUTPUTS (rewritten in place, indent=1): stories/all-stories.json, grammar/c1.json, grammar/c2.json, grammar-quiz/all-gq.json,
#   grammar-quiz/gq-c1.json, gq-c2.json, dialogues/all-dialogues.json, dialogues/dialogues-c1.json, dialogues-c2.json,
#   dialogues/partners.json, dialogues/goals.json. (categories.json and dict.json are not touched.)
# USAGE: python3 tools/apply_review_c12.py [--force]
# SAFE TO RE-RUN: mostly NO. Patches that already applied no longer match exactly once, are reported as BAD, and the script
#   exits 1 before writing (so a plain re-run is a harmless no-op that fails). With --force it writes anyway, skipping BAD patches.
#   It must run AFTER tools/merge_c12.py: re-running merge_c12.py afterwards would discard what this script applied.
# CAVEATS: the BAD check runs after all patch files are processed; an unknown "file" value gives src=None and a TypeError.
import json,glob,sys
# L = load JSON (UTF-8); W = write JSON (keeps non-ASCII, 1-space indent).
def L(p): return json.load(open(p,encoding='utf-8'))
def W(p,d): json.dump(d,open(p,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
# Load everything into memory. S = stories by id (patched in place); G = grammar dicts for c1 and c2 only.
stories=L('stories/all-stories.json'); S={s['id']:s for s in stories}
G={lv:L(f'grammar/{lv}.json') for lv in('c1','c2')}
Q=L('grammar-quiz/all-gq.json'); D=L('dialogues/all-dialogues.json'); P=L('dialogues/partners.json'); GO=L('dialogues/goals.json')
# bad = patches that did not match exactly once; n = patches applied. Patch files are processed in name order.
bad=0;n=0
for f in sorted(glob.glob('new-stories/c12/review/R*.json')):
    for p in L(f)['patches']:
        fl,i=p['file'],p['id']
        # src = the dict holding the target object (for grammar: the c1 or c2 dict chosen by id prefix).
        src={'stories':S,'gq':Q,'dialogues':D,'partners':P,'goals':GO}.get(fl) if fl!='grammar' else G[i[:2]]
        o=src[i]; s=json.dumps(o,ensure_ascii=False)
        if s.count(p['find'])!=1: print('BAD',f,fl,i,p['find'][:50],s.count(p['find'])); bad+=1; continue
        v=json.loads(s.replace(p['find'],p['replace']))
        if fl=='stories': S[i].clear(); S[i].update(v)
        else: src[i]=v
        n+=1
# Write phase: nothing has been written before this point, so exiting on BAD patches leaves the files untouched.
print('applied',n,'bad',bad)
if bad and '--force' not in sys.argv: sys.exit(1)
W('stories/all-stories.json',stories)
for lv in G: W(f'grammar/{lv}.json',G[lv])
W('grammar-quiz/all-gq.json',Q)
for lv in('c1','c2'):
    W(f'grammar-quiz/gq-{lv}.json',{k:v for k,v in sorted(Q.items()) if k.startswith(lv)})
    W(f'dialogues/dialogues-{lv}.json',{k:v for k,v in sorted(D.items()) if k.startswith(lv)})
W('dialogues/all-dialogues.json',D); W('dialogues/partners.json',P); W('dialogues/goals.json',GO)
