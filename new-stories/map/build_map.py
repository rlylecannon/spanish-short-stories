#!/usr/bin/env python3
"""Verify plan.py against stories/all-stories.json and write map.json.
Run: python3 new-stories/map/build_map.py  (from the outputs dir or anywhere)."""
import json, re, os, sys, collections
HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
from plan import T

strip = lambda s: re.sub(r'<[^>]+>', '', s)
stories = {s['id']: s for s in json.load(open(os.path.join(BASE, 'stories/all-stories.json')))}
cats = json.load(open(os.path.join(BASE, 'grammar-quiz/categories.json')))
FAM = set(cats.values()); NEWFAM = {'Por & para', 'Passive voice'}
old_topics = {}
for lv in ('b1', 'b2'):
    for sid, tl in json.load(open(os.path.join(BASE, f'grammar/{lv}.json'))).items():
        for x in tl: old_topics.setdefault(x['topic'], []).append(sid)

def raw_find(raw, plain):
    pat = '(?:<[^>]+>)?'.join(re.escape(c) for c in plain)
    m = re.findall(pat, raw)
    return m[0] if len(m) == 1 else None

errors, out = [], {}
for sid in sorted(T):
    st = stories[sid]; raw = [l[0] for l in st['lines']]; plain = [strip(l) for l in raw]
    edited = list(plain)
    # apply all edits of the story first
    for tpc in T[sid]['topics']:
        for (ln, old, new, en) in tpc['edits']:
            if edited[ln].count(old) != 1: errors.append(f'{sid} line {ln}: old not unique/absent: {old!r}')
            edited[ln] = edited[ln].replace(old, new, 1)
    topics = []
    for tpc in T[sid]['topics']:
        if tpc['family'] not in FAM | NEWFAM: errors.append(f"{sid}: bad family {tpc['family']}")
        if tpc['topic'] in cats and cats[tpc['topic']] != tpc['family']:
            errors.append(f"{sid}: family mismatch for {tpc['topic']}: categories.json says {cats[tpc['topic']]}")
        ev, natural = [], 0
        for (ln, q) in tpc['ev']:
            if q not in edited[ln]: errors.append(f'{sid} line {ln}: evidence not found: {q!r}')
            nat = q in plain[ln]; natural += nat
            ev.append(f"line {ln}: {q}" + ('' if nat else ' [after edit]'))
        cnt = len(tpc['ev'])
        if cnt < 3: errors.append(f"{sid}: {tpc['topic']} has only {cnt}")
        new_flag = tpc['topic'] not in old_topics
        if new_flag != tpc['new']: print(f"note: {sid} '{tpc['topic']}' new flag set {tpc['new']} -> computed {new_flag}")
        eds = []
        for (ln, old, new, en) in tpc['edits']:
            oraw = raw_find(raw[ln], old); nraw = new
            for w in re.findall(r'<b>(.*?)</b>', oraw or ''):
                if w in nraw: nraw = nraw.replace(w, f'<b>{w}</b>', 1)
                else: errors.append(f'{sid} line {ln}: edit drops bolded vocab {w!r}')
            eds.append({'line': ln, 'old': old, 'old_raw': oraw, 'suggest_es': new, 'suggest_es_raw': nraw, 'suggest_en': en})
        topics.append({'topic': tpc['topic'], 'family': tpc['family'], 'new': new_flag,
                       'status': tpc['status'], 'evidence': ev, 'count': cnt,
                       'count_without_edits': natural, 'edits': eds, 'note': tpc['note']})
    out[sid] = {'title': st['title'], 'role': T[sid]['role'], 'line_count': len(raw), 'topics': topics}

# repetition check: same topic string headlined >2 times per level unless 'recycled'
for lv in ('b1', 'b2'):
    c = collections.Counter(t['topic'] for s, v in out.items() if s.startswith(lv) for t in v['topics'])
    for k, n in c.items():
        if n > 2: errors.append(f'{lv}: {k} headlined {n} times')
if errors:
    print('ERRORS:'); print('\n'.join(errors)); sys.exit(1)
json.dump(out, open(os.path.join(HERE, 'map.json'), 'w'), ensure_ascii=False, indent=1)
ne = sum(len(t['edits']) for v in out.values() for t in v['topics'])
print('OK. stories', len(out), 'topics', sum(len(v['topics']) for v in out.values()), 'edits', ne,
      'stories with edits', sum(1 for v in out.values() if any(t['edits'] for t in v['topics'])))
for sid, v in out.items():
    print(sid, v['role'], ' | '.join(f"{t['topic']} [{t['count_without_edits']}->{t['count']}]" for t in v['topics']))
