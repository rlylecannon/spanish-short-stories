#!/usr/bin/env python3
"""usage: validate.py N   -> checks dict/in-N.json against dict/out-N-*.json (merged)"""
import json, glob, sys, os
n = sys.argv[1]; d = os.path.dirname(os.path.abspath(__file__))
inp = json.load(open(f'{d}/in-{n}.json', encoding='utf-8'))
need = [w for w, _ in inp]
out = {}
for f in sorted(glob.glob(f'{d}/out-{n}-*.json')):
    out.update(json.load(open(f, encoding='utf-8')))
POS = {'noun', 'verb', 'adj', 'adv', 'prep', 'conj', 'pron', 'det', 'interj', 'name', 'num', 'other'}
miss = [w for w in need if w not in out]; extra = [w for w in out if w not in set(need)]
bad = []
for w, rs in out.items():
    if not isinstance(rs, list) or not rs or len(rs) > 2: bad.append((w, 'need 1-2 readings')); continue
    for r in rs:
        if not (isinstance(r, list) and len(r) in (3, 4) and all(isinstance(x, str) and x.strip() for x in r[:3])): bad.append((w, 'reading must be [lemma,pos,gloss]')); break
        if r[1] not in POS: bad.append((w, 'pos ' + r[1]))
        if r[1] == 'verb' and not (r[0].endswith('ar') or r[0].endswith('er') or r[0].endswith('ir') or r[0].endswith('ír') or r[0].endswith('se')): bad.append((w, 'verb lemma not infinitive: ' + r[0]))
print(f'forms needed {len(need)}, got {len(out)}, missing {len(miss)}, extra {len(extra)}, bad {len(bad)}')
for m in miss[:20]: print('MISSING', m)
for b in bad[:20]: print('BAD', b)
print('RESULT:', 'OK' if not (miss or bad) else 'FAIL')
sys.exit(0 if not (miss or bad) else 1)
