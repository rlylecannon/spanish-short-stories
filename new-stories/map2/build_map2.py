#!/usr/bin/env python3
"""Builds map2.json from plan2.py: applies the proposed edits in memory (never writes stories),
verifies every 'old' substring, protected lines, and counts evidence on the post-edit text."""
import json, re, os, sys
from collections import defaultdict, OrderedDict
HERE = os.path.dirname(os.path.abspath(__file__))
B = os.path.normpath(os.path.join(HERE, '..', '..')) + '/'
sys.path.insert(0, HERE)
from plan2 import SPEC, B12, EDITS, DROP_WHY, NOTES

S = {s['id']: s for s in json.load(open(B + 'stories/all-stories.json'))}
G = {}
for lv in ['a1', 'a2', 'b1', 'b2']:
    G.update(json.load(open(B + f'grammar/{lv}.json')))
CAT = json.load(open(B + 'grammar-quiz/categories.json'))
MAP1 = json.load(open(B + 'new-stories/map/map.json'))

def tf(x): return re.sub(r'<[^>]+>', '', x)
def nz(x):
    x = x.lower()
    x = re.sub(r'[«»"“”¡!¿?.,;:…—–\-\(\)\[\]\']', ' ', x)
    return re.sub(r'\s+', ' ', x).strip()

OLDGROUP = {
 'Present tense and tener': ['tener', 'present tense'], 'Tener: having things': ['tener'],
 'Telling time: son las / a las': ['time'], 'Ir a + place': ['ir a'], '¿Dónde está…? and porque': ['questions'],
 'Hay and no hay': ['hay'], 'Time with a las': ['time'], 'Estar for location': ['ser/estar'], 'Me gusta': ['gustar'],
 'Estar for place and state': ['ser/estar'], 'Present tense with vivir and leer': ['present tense'],
 'Ser for time, estar for feelings': ['ser/estar', 'time'], 'El sábado: on Saturday': ['time'], 'Ir a + infinitive': ['ir a'],
 'Reflexive verbs: se sentó, se casa': ['reflexive'], 'Preterite of regular and irregular verbs': ['preterite forms'],
 'Regular preterite: cortó, cocinó, probó': ['preterite forms'], 'Falta, lo siento, decirlo': ['object pronouns'],
 'Preterite for events, even irregular': ['preterite forms'], 'Estar + gerund (ongoing action)': ['estar + gerund'],
 'Preterite for sudden events': ['pret vs impf'], 'Reflexive verbs': ['reflexive'], 'Object pronouns: le, la, gustar': ['object pronouns'],
 'Reflexives and ponerse a': ['reflexive'], 'Tú commands: ven, toma, toca': ['commands'], 'Preterite vs imperfect': ['pret vs impf'],
 'Tú commands': ['commands'], 'Reflexives and impersonal se': ['reflexive'], 'Comparatives and superlatives': ['comparatives'],
 'Preterite and imperfect together': ['pret vs impf'], 'Object pronouns: se lo, le, la': ['object pronouns'],
 'Reported speech': ['reported speech'], 'Commands with ustedes and usted': ['commands'],
 'Subjunctive after wishes and hasta que': ['subjunctive: wish/opinion'],
}

# map.json quotes whose wording differs from the text as implemented (same structure, different words)
QFIX = {('b2-04', 7, 'como si la hubiera escrito otra persona'): 'como si otro hombre hubiera escrito aquellas palabras',
        ('b2-08', 10, 'Lo curioso es que era menos épica'): 'lo curioso fue que ellos la acogieron'}

def quotes(example, line):
    # an example quotes a line if its whole text, or any clause of 12+ chars, occurs in the line
    L = nz(line); full = nz(example)
    if len(full) >= 6 and full in L: return True
    return any(len(f) >= 12 and f in L for f in (nz(x) for x in re.split(r'[.!?…]|—|–', example)))

def snippet(line, m, w=28):
    a, b = max(0, m.start() - w), min(len(line), m.end() + w)
    while a > 0 and line[a - 1] not in ' ': a -= 1
    while b < len(line) and line[b] not in ' ': b += 1
    return line[a:b].strip().replace('\n', ' ')

problems = []
out = OrderedDict()
group_of = {}   # topic string -> group
fam_of = {}
for sid in sorted(S):
    lv = sid[:2]
    raw = [l[0] for l in S[sid]['lines']]
    orig = [tf(l) for l in raw]
    new = list(orig); new_raw = list(raw)
    # ---- topics spec
    if lv in ('a1', 'a2'):
        rows = [r for r in SPEC[sid]]
    else:
        rows = B12[sid]
    cur_topics = [t['topic'] for t in G[sid]]
    final_topics = [r[0] for r in rows]
    keep = [t for t in final_topics if t in cur_topics]
    drop = [t for t in cur_topics if t not in final_topics]
    # ---- edits
    edits = EDITS.get(sid, [])
    edit_recs = defaultdict(list)
    for (ln, old, es, en, topic) in edits:
        line = new[ln]
        c = line.count(old)
        if c != 1: problems.append(f'{sid} line {ln}: old occurs {c}x: {old!r}')
        if orig[ln].count(old) != 1: problems.append(f'{sid} line {ln}: old not exactly once in ORIGINAL tag-free line')
        new[ln] = line.replace(old, es, 1)
        rc = new_raw[ln].count(old)
        rec = {'line': ln, 'old': old, 'suggest_es': es, 'suggest_en': en}
        if rc == 1:
            new_raw[ln] = new_raw[ln].replace(old, es, 1)
        else:
            problems.append(f'{sid} line {ln}: old not found verbatim in raw (tags inside)')
        # protected check: any kept-topic example quoting this line?
        prot = []
        for t in G[sid]:
            if t['topic'] not in keep: continue
            for ex in t['examples']:
                if quotes(ex[0], orig[ln]):
                    prot.append((t['topic'], ex[0]))
        if prot: problems.append(f'{sid} line {ln} is PROTECTED by {prot}')
        rec['line_now'] = orig[ln]
        rec['line_after'] = new[ln]
        rec['line_after_raw'] = new_raw[ln]
        edit_recs[topic].append(rec)
    # tag check: line_after_raw tag-free == line_after
    for ln in range(len(raw)):
        if tf(new_raw[ln]) != new[ln]: problems.append(f'{sid} line {ln}: raw/tag-free mismatch after edit')
    # ---- evidence
    topics_out = []
    for r in rows:
        if len(r) == 2:  # kept B1/B2 topic -> map.json evidence
            topic, group = r
            m1 = next(t for t in MAP1[sid]['topics'] if t['topic'] == topic)
            fam = m1['family']; role = m1['status'].replace('recycled', 'recycles')
            ev = []; missing = []
            for e in m1['evidence']:
                mm = re.match(r'line (\d+): (.*?)( \[after edit\])?$', e)
                ln, q = int(mm.group(1)), mm.group(2)
                q = QFIX.get((sid, ln, q), q)
                if q in new[ln]: ev.append(f'line {ln}: {q}')
                else: missing.append(e)
            cnt = len(ev); cnt0 = sum(1 for e in ev if e.split(': ', 1)[1] in orig[int(e.split(':')[0][5:])])
            status = 'keep'
            if missing: problems.append(f'{sid} {topic}: map.json evidence not in current text: {missing}')
            pat = None
        else:
            topic, fam, group, role, kind, pat = r
            if topic in CAT: fam = CAT[topic]
            ev = []; cnt0 = 0
            for i, l in enumerate(new):
                for m in re.finditer(pat, l):
                    sn = snippet(l, m)
                    a, b = max(0, m.start() - 8), min(len(l), m.end() + 8)
                    tag = '' if l[a:b] in orig[i] else ' [after edit]'
                    ev.append(f'line {i}: {sn}{tag}')
            for i, l in enumerate(orig):
                cnt0 += len(re.findall(pat, l))
            cnt = len(ev)
            status = 'keep' if topic in cur_topics else role
        group_of[topic] = group; fam_of[topic] = fam
        if cnt < 3: problems.append(f'{sid} {topic}: only {cnt} tokens')
        td = OrderedDict(topic=topic, family=fam, group=group, status=status, role=role,
                         new=topic not in cur_topics, evidence=ev, count=cnt, count_without_edits=cnt0,
                         edits=[{k: v for k, v in e.items() if k in ('line', 'old', 'suggest_es', 'suggest_en')} for e in edit_recs.get(topic, [])])
        if pat: td['pattern'] = pat
        # raw versions where markup sits next to the edit
        for e, full in zip(td['edits'], edit_recs.get(topic, [])):
            if full['line_after_raw'] != full['line_after']:
                e['line_after_raw'] = full['line_after_raw']
        topics_out.append(td)
    # protected lines list (all lines quoted by kept-topic examples)
    protected = set()
    for t in G[sid]:
        if t['topic'] not in keep: continue
        for ex in t['examples']:
            for i, l in enumerate(orig):
                if quotes(ex[0], l): protected.add(i)
    out[sid] = OrderedDict(title=S[sid]['title'], level=S[sid]['level'], keep=keep, topics=topics_out,
                           drop=drop, drop_why={d: DROP_WHY.get(sid, {}).get(d, '') for d in drop},
                           protected_lines=sorted(protected), edit_count=len(edits),
                           note=NOTES.get(sid, ''))

# before/after group counts (stories per level that headline the group)
def groups_of_topic(t):
    if t in OLDGROUP: return OLDGROUP[t]
    return [group_of[t]]
before = defaultdict(lambda: defaultdict(set)); after = defaultdict(lambda: defaultdict(set))
for sid in S:
    lv = sid[:2]
    for t in G[sid]:
        for g in groups_of_topic(t['topic']): before[lv][g].add(sid)
    for t in out[sid]['topics']:
        after[lv][t['group']].add(sid)
for lv in after:
    for g, ss in after[lv].items():
        if len(ss) > 2: problems.append(f'DEDUPE {lv} {g}: {sorted(ss)}')
for g in set(after['a1']) | set(after['a2']):
    n = len(after['a1'].get(g, set())) + len(after['a2'].get(g, set()))
    if n > 3: problems.append(f'DEDUPE A1+A2 {g}: {n}')

summary = {
 'groups_before': {lv: {g: sorted(s) for g, s in sorted(d.items())} for lv, d in before.items()},
 'groups_after': {lv: {g: sorted(s) for g, s in sorted(d.items())} for lv, d in after.items()},
 'total_edits': sum(len(v) for v in EDITS.values()),
 'stories_edited': sorted(EDITS),
 'slots': {lv: sum(len(out[s]['topics']) for s in out if s.startswith(lv)) for lv in ['a1', 'a2', 'b1', 'b2']},
 'new_topic_strings': {t['topic']: t['family'] for s in out.values() for t in s['topics'] if t['topic'] not in CAT},
 'problems': problems,
}
json.dump(out, open(os.path.join(HERE, 'map2.json'), 'w'), ensure_ascii=False, indent=1)
json.dump(summary, open(os.path.join(HERE, '_summary.json'), 'w'), ensure_ascii=False, indent=1)
print('problems:', len(problems)); print('\n'.join(problems))
print('edits', summary['total_edits'], 'slots', summary['slots'])
