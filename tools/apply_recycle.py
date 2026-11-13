# ONE-OFF EDIT SCRIPT (earlier "recycle" editing pass). Not a routine build step.
# PURPOSE: apply find/replace patches and replacement entries from recycle/tasks/G*.json to the A1-B2 content files, in memory,
#   and then write everything back.
# TASK FILE SHAPE: {"patches": [{"file": stories|grammar|gq|dialogues|scenes, "id": story id, "find": text, "replace": text}],
#   optional "grammar_replace": {id: grammar list}, "gq_replace": {id: question list}, "categories_add": {topic: category},
#   "dict_add": {key: [entries whose first item is the headword]}}.
# HOW A PATCH WORKS: the target object is serialised with json.dumps(ensure_ascii=False), `find` must occur EXACTLY ONCE in that
#   text (so it is matched against JSON-escaped text, e.g. quotes appear as \"), it is replaced, and the result is parsed back.
# INPUTS (paths relative to the CURRENT DIRECTORY, so run from the project root; R='.' is unused): stories/all-stories.json,
#   grammar/{a1,a2,b1,b2}.json, grammar-quiz/{all-gq.json,categories.json}, dialogues/all-dialogues.json, art/scenes-*.json,
#   dict/dict.json, recycle/tasks/G*.json.
# OUTPUTS (all rewritten in place with indent=1, which also reformats files whose layout differed): stories/all-stories.json,
#   grammar/a1..b2.json, grammar-quiz/all-gq.json, grammar-quiz/gq-{a1..b2}.json, dialogues/dialogues-{a1..b2}.json,
#   dialogues/all-dialogues.json, every art/scenes-*.json, grammar-quiz/categories.json, dict/dict.json.
# USAGE: python3 tools/apply_recycle.py [--force]
# SAFE TO RE-RUN: NO. It overwrites many data files and replacement entries (grammar_replace / gq_replace / dict_add) would
#   clobber any later hand edits. Patches that already applied no longer match, are reported as BAD, and the script exits 1
#   before writing; --force skips that stop and writes anyway (BAD patches are simply not applied). Back up first.
# CAVEATS: only grammar/a1-b2.json are loaded, so a "grammar" patch for a c1/c2 id raises KeyError; the per-level
#   gq-<lv>.json and dialogues-<lv>.json files are rewritten for a1-b2 only (all-gq / all-dialogues cover every level);
#   an unknown scene id makes scene_obj() return (None, None) and crash; the BAD check runs after ALL task files are processed.
import json,glob,sys,os
R='.'
# L = load JSON (UTF-8); W = write JSON (keeps non-ASCII, 1-space indent).
def L(p): return json.load(open(p,encoding='utf-8'))
def W(p,d): json.dump(d,open(p,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
# Load everything into memory first. S = stories by id (patched in place); G = grammar dicts keyed by level prefix a1..b2;
# sc = {scene file path: parsed content}. (GF is unused.)
stories=L('stories/all-stories.json'); S={s['id']:s for s in stories}
G={};GF={}
for lv in('a1','a2','b1','b2'):
    G[lv]=L(f'grammar/{lv}.json')
Q=L('grammar-quiz/all-gq.json'); D=L('dialogues/all-dialogues.json')
sc={}
for f in glob.glob('art/scenes-*.json'): sc[f]=L(f)
# scene_obj(id) -> (file path, container) for the scene file that holds story `id`; a scenes file is either a dict keyed
# by id or a list of objects with an 'id' field.
def scene_obj(i):
    for f,d in sc.items():
        if isinstance(d,dict) and i in d: return f,d
        if isinstance(d,list):
            for k,o in enumerate(d):
                if o.get('id')==i: return f,d
    return None,None
# Main loop: one task file at a time, in sorted order. `bad` counts patches whose `find` text did not match exactly once.
bad=0
cat=L('grammar-quiz/categories.json'); dic=L('dict/dict.json')
for f in sorted(glob.glob('recycle/tasks/G*.json')):
    t=L(f)
    for p in t['patches']:
        # Pick the target object: grammar entries are looked up in the dict for their level prefix (id[:2], e.g. 'a1').
        fl,i=p['file'],p['id']
        if fl=='stories': o=S[i]; 
        elif fl=='grammar': o=G[i[:2]][i]
        elif fl=='gq': o=Q[i]
        elif fl=='dialogues': o=D[i]
        elif fl=='scenes':
            ff,d=scene_obj(i); o=d[i] if isinstance(d,dict) else [x for x in d if x.get('id')==i][0]
        # Exact-once match on the JSON text, then write the parsed result back to wherever it lives (stories are
        # updated in place via clear()+update() so the `stories` list keeps the same dict objects).
        s=json.dumps(o,ensure_ascii=False)
        if s.count(p['find'])!=1: print('BAD',f,i,p['find'][:60],s.count(p['find'])); bad+=1; continue
        n=json.loads(s.replace(p['find'],p['replace']))
        if fl=='stories': S[i].clear(); S[i].update(n)
        elif fl=='grammar': G[i[:2]][i]=n
        elif fl=='gq': Q[i]=n
        elif fl=='dialogues': D[i]=n
        else:
            if isinstance(d,dict): d[i]=n
            else:
                for k,x in enumerate(d):
                    if x.get('id')==i: d[k]=n
    # Whole-entry replacements and additions from the same task file (these overwrite without any match check).
    for i,g in t.get('grammar_replace',{}).items(): G[i[:2]][i]=g
    for i,q in t.get('gq_replace',{}).items(): Q[i]=q
    cat.update(t.get('categories_add',{}))
    for k,v in t.get('dict_add',{}).items():
        if k in dic:
            # merge entries by headword
            have={e[0]:e for e in dic[k]}
            for e in v: have[e[0]]=e
            dic[k]=list(have.values())
        else: dic[k]=v
# Write phase. Nothing has been written before this point, so exiting here on BAD patches leaves the files untouched.
print('bad',bad)
if bad and '--force' not in sys.argv: sys.exit(1)
W('stories/all-stories.json',stories)
for lv in G: W(f'grammar/{lv}.json',G[lv])
W('grammar-quiz/all-gq.json',Q)
for lv in('a1','a2','b1','b2'):
    W(f'grammar-quiz/gq-{lv}.json',{k:v for k,v in Q.items() if k.startswith(lv)})
    p=f'dialogues/dialogues-{lv}.json'
    W(p,{k:v for k,v in D.items() if k.startswith(lv)})
W('dialogues/all-dialogues.json',D)
for f,d in sc.items(): W(f,d)
W('grammar-quiz/categories.json',cat); W('dict/dict.json',dic)
print('ok')
