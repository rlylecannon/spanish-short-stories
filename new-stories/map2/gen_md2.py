#!/usr/bin/env python3
import json, os, re
from collections import defaultdict
HERE = os.path.dirname(os.path.abspath(__file__))
B = os.path.normpath(os.path.join(HERE, '..', '..')) + '/'
M = json.load(open(os.path.join(HERE, 'map2.json')))
SUM = json.load(open(os.path.join(HERE, '_summary.json')))
G = {}
for lv in ['a1', 'a2', 'b1', 'b2']:
    G.update(json.load(open(B + f'grammar/{lv}.json')))
CAT = json.load(open(B + 'grammar-quiz/categories.json'))
LV = ['a1', 'a2', 'b1', 'b2']
o = []
w = o.append
tot_edits = SUM['total_edits']; ed_st = SUM['stories_edited']
w('# Grammar map v2: A1–B2 (all 40 stories)\n')
w('Files: `map2.json` (machine-readable), `plan2.py` (source of the map), `build_map2.py` (applies the edits in memory, checks every `old` substring, protected lines and token counts against `stories/all-stories.json`, then writes map2.json) and `gen_md2.py` (writes this page). No story, card or quiz file was changed.\n')
w('**How to read it**')
w('- "line N" is the 0-based index into the story\'s `lines` array. Evidence marked `[after edit]` exists only once the proposed edit is applied.')
w('- Counts are measured with a regex per topic (stored as `pattern` in map2.json) on the tag-free text. Kept B1/B2 topics reuse the verified evidence of `new-stories/map/map.json` (2 quotes re-worded to match the text as implemented: b2-04 line 7, b2-08 line 10).')
w('- Status: **keep** = topic string unchanged; **introduces / recycles** = new slot. `role` in map2.json gives introduces/recycles for every topic.')
w('- Dedupe is counted on fine-grained *headline groups* (estar, time, tener, ir a, reflexives, tú commands, preterite/imperfect contrast …), the units the audits counted. The 15 families of categories.json are too coarse for this (one family holds gustar, ir a, querer, tener que and the future). Both views are tabled below.')
w('- Every edit replaces text inside one line: line count, plot and `<b>` markup are unchanged. No edited line is quoted by an example of a topic that stays on that story (the `protected_lines` list per story).\n')
w(f'**Totals:** {sum(SUM["slots"].values())} topic slots (A1 {SUM["slots"]["a1"]}, A2 {SUM["slots"]["a2"]}, B1 {SUM["slots"]["b1"]}, B2 {SUM["slots"]["b2"]}); **{tot_edits} edits in {len(ed_st)} stories** ({", ".join(ed_st)}); every story has 3–4 topics; every topic has ≥3 verified tokens after edits; no headline group is in more than 2 stories of a level or more than 3 across A1+A2. Build check: 0 problems.\n')

def topic_cell(t):
    tag = {'keep': 'kept', 'introduces': 'NEW · introduces', 'recycles': 'NEW · recycles'}[t['status']]
    role = '' if t['status'] != 'keep' else f' · {t["role"]}'
    c = f'{t["count_without_edits"]}→{t["count"]}' if t['count'] != t['count_without_edits'] else f'{t["count"]}'
    return f'**{t["topic"]}** ({tag}{role} · {c})'

for lv in LV:
    w(f'## {lv.upper()} map\n')
    w('| Story | Topics after (status · tokens now→after edits) | Dropped | Edits |')
    w('|---|---|---|---|')
    for sid, v in M.items():
        if not sid.startswith(lv): continue
        tops = '<br>'.join(topic_cell(t) for t in v['topics'])
        drops = '; '.join(v['drop']) or '–'
        w(f'| {sid} {v["title"]} | {tops} | {drops} | {v["edit_count"] or "–"} |')
    w('')
    notes = [(s, v['note']) for s, v in M.items() if s.startswith(lv) and v['note']]
    if notes:
        w('Notes for the cards:')
        for s, n in notes: w(f'- **{s}:** {n}')
        w('')
    dr = [(s, d, why) for s, v in M.items() if s.startswith(lv) for d, why in v['drop_why'].items()]
    if dr:
        w('<details><summary>Why each topic was dropped</summary>\n')
        for s, d, why in dr: w(f'- {s} · *{d}*: {why}')
        w('\n</details>\n')

# ---- group counts
w('## Headline slots per group, before → after\n')
w('Number of stories that headline the group (before = current `grammar/<lv>.json`). Groups with no change at 1 are omitted.\n')
gb, ga = SUM['groups_before'], SUM['groups_after']
for pair in (['a1', 'a2'], ['b1', 'b2']):
    groups = sorted(set().union(*[set(gb.get(l, {})) | set(ga.get(l, {})) for l in pair]))
    hdr = '| Group | ' + ' | '.join(f'{l.upper()} before → after (stories)' for l in pair) + (' | A1+A2 |' if pair[0] == 'a1' else ' |')
    w(hdr); w('|---|' + '---|' * len(pair) + ('---|' if pair[0] == 'a1' else ''))
    for g in groups:
        cells = []; changed = False; tb = ta = 0
        for l in pair:
            b = gb.get(l, {}).get(g, []); a = ga.get(l, {}).get(g, [])
            tb += len(b); ta += len(a)
            if len(b) != len(a) or len(b) > 1 or len(a) > 1: changed = True
            mark = ' ⚠' if len(b) > 2 else ''
            cells.append(f'{len(b)}{mark} → {len(a)} ({", ".join(x[3:] for x in a) or "–"})')
        if not changed: continue
        extra = f' {tb} → {ta} |' if pair[0] == 'a1' else ''
        w(f'| {g} | ' + ' | '.join(cells) + ' |' + extra)
    w('')
w('⚠ = over the cap before (more than 2 stories per level). After: max 2 per level everywhere; max 3 across A1+A2 (time, ser/estar, gustar, ir a, reflexive, comparatives at exactly 3).\n')

# ---- family table
w('## Slots per categories.json family, before → after\n')
fb = {l: defaultdict(int) for l in LV}; fa = {l: defaultdict(int) for l in LV}
for sid in M:
    l = sid[:2]
    for t in G[sid]: fb[l][CAT.get(t['topic'], '(not in categories.json)')] += 1
    for t in M[sid]['topics']: fa[l][t['family']] += 1
fams = sorted(set().union(*[set(fb[l]) | set(fa[l]) for l in LV]))
w('| Family | ' + ' | '.join(l.upper() for l in LV) + ' |'); w('|---|' + '---|' * 4)
for f in fams:
    w(f'| {f} | ' + ' | '.join(f'{fb[l].get(f, 0)} → {fa[l].get(f, 0)}' for l in LV) + ' |')
w('')

# ---- gaps
GAPS = [
 ('A1', 'muy vs mucho', 'a1-07', 'Muy and mucho'),
 ('A1', 'demonstratives este/esta', 'a1-09', 'Demonstratives: este, esta, estas'),
 ('A1', 'tener que / hay que', 'a1-08', 'Tener que + infinitive'),
 ('A1', 'numbers / prices', 'a1-05', 'Numbers and prices: ¿Cuánto es?'),
 ('A2', 'saber vs conocer', 'a2-04', 'Saber vs conocer'),
 ('A2', 'demonstratives este/ese/aquel', 'a2-10', 'Demonstratives: este, ese, aquel'),
 ('A2', 'courtesy conditional', 'a2-05', 'Courtesy conditional: podría, te gustaría'),
 ('A2', 'simple future basics', 'a2-06', 'Simple future: dará, seré'),
 ('A2', 'por vs para', 'a2-06', 'Por vs para: por la tarde, para ti'),
 ('A2', 'gustar-type verbs', 'a2-03', 'Gustar-type verbs: faltar, encantar'),
 ('A2', 'irregular preterite stems', 'a2-03', 'Irregular preterite: fue, puso, hice, dijo'),
 ('A2', '(essentials) negatives, obligation', 'a2-08', 'Negative words: nadie, nada'),
 ('B1', 'accidental se', 'b1-09', 'Accidental se: se le olvidó, se le acabó'),
 ('B1', 'connectors (sin embargo, por eso, a pesar de)', 'b1-05', 'Connectors: por eso, así que, a pesar de'),
 ('B1', 'ser/estar with meaning change', 'b1-03', 'Ser and estar: listo, rico'),
 ('B1', 'future of probability', 'b1-10', 'Future of probability: ¿será…?'),
 ('B1', 'acabar de / dejar de', 'b1-06', 'Acabar de and dejar de'),
 ('B2', 'verb + preposition', 'b2-06', 'Verb + preposition: depender de, pensar en'),
 ('B2', 'mixed conditionals', 'b2-04', 'Mixed conditionals: si hubiera…, ahora sería'),
]
w('## Gaps now covered\n')
w('| Level | Gap | Story | Topic | Tokens now → after | Edits |'); w('|---|---|---|---|---|---|')
for lv, gap, sid, top in GAPS:
    t = next(x for x in M[sid]['topics'] if x['topic'] == top)
    w(f'| {lv} | {gap} | {sid} | {top} | {t["count_without_edits"]} → {t["count"]} | {len(t["edits"])} |')
w('')
w('Also fixed from the audit findings:')
w('- **a1-03** now introduces something: the first tener card and the first ser/estar contrast (a1-01/a1-02 no longer headline tener).')
w('- **a1-09 / a1-10** no longer share ir a: a1-09 keeps it, a1-10 takes stem-changing verbs (quiere, encuentra; essentials-a1 topic).')
w('- **a2-01** card already teaches yo/tú preterite endings (patched in audit 2); keep that text.')
w('- **a2-08** (no new grammar before) now carries negative words, obligation (hay que, deber, tener que) and ustedes.')
w('- **Por/para and gustar-type verbs** each get an A2 story card (a2-06, a2-03), not just the essentials deck.')
w('- **B1 dedupe**: reported speech (b1-06), usted/ustedes commands (b1-09) and wish-subjunctive (b1-10) were third B1 slots; replaced by acabar de/dejar de, accidental se and the probability future. The rest of the B1/B2 map is unchanged (4th topics added in b1-03, b1-05, b2-04, b2-06).\n')
w('## Partly covered or not covered\n')
w('- **B2 estar + gerund / participle nuance**: no new slot (no room without dropping a working topic). Covered by b2-06 *Estar + participle: resulting state* (estaba parado, está roto) and A2 *Estar + gerund* (a2-05). The aspectual nuance (*está siendo*, *estar + gerund* for annoyance) is not headlined anywhere.')
w('- **hay que** (A1) is folded into the kept a1-08 string *Tener que + infinitive* (1 token after edit + 3 tener que); add one line to the card explanation rather than a new string.')
w('- **irregular preterite stems** (A2) ride on the kept a2-03 string: puso, hice, dijo, tuve (after edit). estuve/pude/vine are not in that story (pudo appears in a2-09, vine nowhere).')
w('- **gustar-type**: faltar and encantar only; doler appears at B1 (b1-02 *me duele la rodilla*, b1-04 *¿Le duele algo?*), interesar nowhere.')
w('- **aquel** has 1 token at A2 (a2-10, after edit); este/ese carry the card.')
w('- **Ustedes** (a2-08) rests on exactly 3 tokens (Ustedes son, los está buscando, Los busqué).')
w('- **Estar + gerund** (a2-05) has 3 tokens after edit; *estaba en su sala, tomando té* is a progressive with a locative in between.')
w('- Still absent from story headlines (not requested here): present perfect subjunctive (haya + participle) and future perfect at B1/B2, as noted in map.md.\n')

# ---- edits
w(f'## All {tot_edits} edits\n')
w('`old` occurs exactly once in the tag-free line (checked before and after the other edits of the same story). EN is the suggested replacement for the whole English line unless marked.\n')
w('| Story | Line | Old (tag-free) | Suggested Spanish | Suggested English | For topic |'); w('|---|---|---|---|---|---|')
for sid, v in M.items():
    for t in v['topics']:
        for e in t['edits']:
            w(f'| {sid} | {e["line"]} | {e["old"]} | {e["suggest_es"]} | {e["suggest_en"]} | {t["topic"]} |')
w('')
w('No `old` substring contains `<b>` markup, so each edit is a plain find-and-replace in the raw line and every bolded word stays bolded (checked: tag-free raw line after edit = tag-free line after edit). Where the line carries markup, `line_after_raw` in map2.json gives the full raw line after the edit.\n')

# ---- strings
w('## Topic strings to add to `grammar-quiz/categories.json`\n')
for t, f in SUM['new_topic_strings'].items(): w(f'- {t} → {f}')
w('')
w('Each new topic needs a card in `grammar/<lv>.json` (explain + 3 examples quoted from the evidence lines) and grammar-quiz items. Dropped strings can stay in categories.json; their gq items should be re-anchored or retired.\n')
w('**Dropped headline strings:** ' + '; '.join(sorted({d for v in M.values() for d in v['drop']})) + '.\n')
open(os.path.join(HERE, 'map2.md'), 'w').write('\n'.join(o))
print('ok', len(o))
