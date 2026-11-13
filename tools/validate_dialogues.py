#!/usr/bin/env python3
"""usage: validate_dialogues.py dialogues/dialogues-a1.json  -- checks structure of role-play scripts"""
# PURPOSE: structural check of role-play dialogue files before they are merged into dialogues/all-dialogues.json.
# INPUT: one or more JSON files shaped {story id: {"steps": [step, ...]}}. A step is {say, en} plus either
#   "r": [[reply_es, reply_en, next_step_index], ...] (2-3 choices) or "end": true. Paths are used as given (no project-root assumption).
# OUTPUT: prints "<path> <n> stories OK" or the list of problems; exit status 0 if every file passed, else 1. Writes nothing.
# USAGE: python3 tools/validate_dialogues.py dialogues/dialogues-a1.json [more.json ...]
# SAFE TO RE-RUN: yes (read-only).
# RULES CHECKED: 4-8 steps; non-empty say/en on every step; no em/en dashes in `say`; end steps carry no replies; other steps
#   have 2-3 replies; each reply's next index is an int, strictly greater than the current index and < number of steps
#   (forward-only, so a dialogue cannot loop); the last step is an end step; every step is reachable from step 0.
# LIMITS: structure only. It does not check Spanish quality or the `en` translations; an end step in the middle is accepted.
import json,sys,re
# check(path) -> True if the file has no problems. A story with a bad step count is reported and skipped (`continue`).
def check(path):
    d=json.load(open(path,encoding='utf-8')); errs=[]
    for sid,sc in d.items():
        st=sc.get('steps')
        if not isinstance(st,list) or not 4<=len(st)<=8: errs.append(f'{sid}: need 4-8 steps'); continue
        for i,s in enumerate(st):
            if not s.get('say') or not s.get('en'): errs.append(f'{sid}[{i}]: say/en missing')
            for k in ('say',):
                if re.search(r'[—–]',s.get('say','')): errs.append(f'{sid}[{i}]: no dashes, use plain sentences')
            if s.get('end'):
                if 'r' in s: errs.append(f'{sid}[{i}]: end step must not have r')
            else:
                r=s.get('r')
                if not isinstance(r,list) or not 2<=len(r)<=3: errs.append(f'{sid}[{i}]: 2-3 replies required'); continue
                for x in r:
                    if not (isinstance(x,list) and len(x)==3 and isinstance(x[2],int) and i<x[2]<len(st)): errs.append(f'{sid}[{i}]: bad reply {x} (next index must be > current and < {len(st)})')
        if not st[-1].get('end'): errs.append(f'{sid}: last step must be end:true')
        # (reachability walk: because replies only point forward, one in-order pass that follows replies from visited steps is enough)
        # every non-end step reachable
        seen={0}; # steps known reachable, starting from step 0
        for i,s in enumerate(st):
            if i in seen:
                for x in s.get('r',[]): 
                    if isinstance(x,list) and len(x)==3: seen.add(x[2])
        if len(seen)<len(st)-0 and any(i not in seen for i in range(len(st))): errs.append(f'{sid}: unreachable steps {[i for i in range(len(st)) if i not in seen]}')
    print(path, len(d),'stories', 'OK' if not errs else '')
    for e in errs: print('  ',e)
    return not errs
if __name__=='__main__': sys.exit(0 if all(check(p) for p in sys.argv[1:]) else 1)
