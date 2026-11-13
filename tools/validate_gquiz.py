#!/usr/bin/env python3
"""usage: validate_gquiz.py grammar-quiz/gq-a1.json -- structure check for grammar quiz questions"""
# PURPOSE: structural check of grammar-quiz files ({story id: [question, ...]}), e.g. grammar-quiz/gq-a1.json.
# QUESTION SHAPE: {topic, q, options[4], answer (index 0-3), why}.
# INPUTS: the files named on the command line, plus grammar/{a1,a2,b1,b2}.json read RELATIVE TO THE CURRENT DIRECTORY, so run it
#   from the project root. If those grammar files cannot be read the error is swallowed and the topic checks are skipped.
# OUTPUT: prints "<path> <n> stories OK" or the problems; exit status 0 if all files passed, else 1. Writes nothing.
# USAGE (from project root): python3 tools/validate_gquiz.py grammar-quiz/gq-a1.json
# SAFE TO RE-RUN: yes (read-only).
# KNOWN PROBLEM: the per-story count rule below still demands 3-4 questions, but every story in grammar-quiz/all-gq.json now has 8,
#   so this check fails for every story ("need 3-4 questions") and, because of the `continue`, none of the per-question
#   checks run for it. Change the 3<=len(qs)<=4 bounds before relying on this tool.
# OTHER CHECKS: required keys; 4 distinct options (compared trimmed, case-insensitive); integer answer index 0-3; question topic must
#   appear in that story's grammar list; at least min(3, number of grammar topics) distinct topics per story.
# LIMITS: C1/C2 grammar files are not loaded (only a1-b2), so topic checks do nothing for C-level stories. The check runs on
#   the authored files; the option shuffle happens later in tools/build_site.py.
import json,sys,re
# check(path) -> True if the file has no problems. G = {story id: [grammar entries with a 'topic']} merged from grammar/*.json.
def check(path):
    d=json.load(open(path,encoding='utf-8')); G={}
    for lv in ('a1','a2','b1','b2'):
        try: G.update(json.load(open(f'grammar/{lv}.json',encoding='utf-8')))
        except Exception: pass
    errs=[]
    for sid,qs in d.items():
        # (stale rule: stories now carry 8 questions; see KNOWN PROBLEM in the header)
        if not isinstance(qs,list) or not 3<=len(qs)<=4: errs.append(f'{sid}: need 3-4 questions'); continue
        topics=[g['topic'] for g in G.get(sid,[])]
        for i,q in enumerate(qs):
            for k in ('topic','q','options','answer','why'):
                if k not in q: errs.append(f'{sid}[{i}]: missing {k}')
            o=q.get('options',[])
            if len(o)!=4 or len(set(x.strip().lower() for x in o))!=4: errs.append(f'{sid}[{i}]: need 4 distinct options')
            if not isinstance(q.get('answer'),int) or not 0<=q.get('answer',9)<4: errs.append(f'{sid}[{i}]: bad answer index')
            if q.get('topic') and topics and q['topic'] not in topics: errs.append(f'{sid}[{i}]: topic not in grammar list: {q["topic"]!r}')
        if len({q.get('topic') for q in qs})<min(3,len(topics)): errs.append(f'{sid}: questions should cover different grammar topics')
    print(path,len(d),'stories','OK' if not errs else '')
    for e in errs: print('  ',e)
    return not errs
if __name__=='__main__': sys.exit(0 if all(check(p) for p in sys.argv[1:]) else 1)
