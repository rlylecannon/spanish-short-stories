/* Flat-color scene renderer ("style K"): soft colors, no body outlines, a darker shade on one side,
   fine lines only for details. Works in browsers and Node. Art.scene(spec) -> SVG string (viewBox 0 0 400 300).
   Same scene data as the old sketch renderer. Only plain SVG elements are emitted. */
/* DEVELOPER NOTES
   Consumed by: tools/build_site.py (inlined into index.html as a <script>, exposes window.Art), art/render.js and
   tools/art_compare.js (Node, via module.exports). No dependencies; output is a plain SVG string.

   Scene JSON (art/scenes-<level>.json is { "<story id>": spec }; spec may also be a bare items array):
     items  array of drawables, painted in order (later = in front). Common fields: x, y (anchor, default y = 250 which is
            the ground line), s (scale, default 1), flip (mirror horizontally), r (rotation in degrees).
            t:'person' -> person(): skin a-f, hair, hc (hair colour key k/g/b/r/y/w), outfit, pose, acc[] (accessories),
                          shirt/pants/hatc/packc/wrapc colour overrides, seat/sit for seated poses.
            t:'obj'    -> a prop from P by name `n` (e.g. 'bus'); optional `c` = [base, detail] palette override; some props
                          read extra options from the item (w, h, v variant, skin).
            t:'svg'    -> raw SVG markup in `svg`, drawn in item-local coordinates, recoloured by flat().
            t:'line'   -> straight line x1,y1 -> x2,y2 with optional width w (capped at 4).
     vb     [x, y, w, h] viewBox crop (default 0 0 400 300); the pixel size attributes stay 400x300.
     ink    [A, B] two-colour print pair for the duotone mode (default navy + coral); art/inks.json is a
            per-country table of such pairs (the pair is stored in each scene's own "ink" field; no script reads inks.json).
     inks   optional 3+ colour list for multi-ink mode (A, B, then extra colour families); dots1 also makes B a halftone ink.
     gy     ground line y (default 252); ground:false / bg:false drop the ground band / paper background.
     flat   true -> render with sceneFlat() (flat coloured style) instead of the duotone screenprint style.
   Render modes: Art.scene(spec) duotone/halftone; opts.simple = solid fills only (no patterns/filters; used for PNG/PDF
   rasterising); opts.fx = hand-drawn wobble + paper grain (inline story pictures); opts.flat = sceneFlat(). */
(function (root) {
  // Skin tones a-f (light to dark), hair colours, and default shirt/pants pools picked per person by hash().
  const DK = '#2a1d16', LT = '#F7F2EA', INKD = '#2b2b2b';
  const SKIN = { a: '#f7dfca', b: '#eec29b', c: '#d19a6c', d: '#a66b43', e: '#7a4a2e', f: '#523224' };
  const HAIRC = { k: '#1c1512', g: '#cfcfcf', b: '#6b4a2e', r: '#c0502d', y: '#e5c76b', w: '#ffffff' };
  const SHIRTS = ['#2F5D62', '#E06D53', '#E8A23B', '#5B7DB1', '#7A9E7E', '#B5667A', '#8C6BB1', '#4D6A8A'];
  const PANTS = ['#3A4A5C', '#5A4636', '#2E3A3F', '#6B5B4B'];
  // n: round to 1 decimal (keeps SVG output short and stable).
  const n = v => Math.round(v * 10) / 10;
  // hash: small deterministic string -> uint32 hash. Used instead of Math.random so the same scene always renders the same
  // (default shirt/pants per person, fallback prop colours, wall colour, unique SVG ids).
  const hash = s => { let h = 7; s = String(s); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  // mix(hex, to, a): blend each RGB channel of a 6-digit '#rrggbb' colour toward the grey level `to` (0..255) by fraction a.
  // darken = mix toward black (default .15), lighten = mix toward white (default .35). 3-digit hex is NOT supported here.
  const mix = (hex, to, a) => { const c = v => parseInt(hex.slice(v, v + 2), 16), d = v => Math.round(c(v) + (to - c(v)) * a); return '#' + [1, 3, 5].map(v => d(v).toString(16).padStart(2, '0')).join(''); };
  const darken = (hex, a) => mix(hex, 0, a === undefined ? .15 : a), lighten = (hex, a) => mix(hex, 255, a === undefined ? .35 : a);
  // shade: the darker "far side" half-shape painted over a flat fill (the style's only shading). line: fine rounded detail stroke.
  const shade = (d, base) => `<path d="${d}" fill="${darken(base)}"/>`;
  const line = (d, c, w) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w || 1.8}" stroke-linecap="round" stroke-linejoin="round"/>`;

  /* ---------- people ---------- */
  // person(o): returns SVG markup for one figure in local coordinates: feet at y=0, origin x=0, head centre at HY (-128).
  // Layers are built as strings (hback, back, legs, body, arms, head, front, extra) and stacked in the order at the end.
  // Colours not given in `o` come from hash() of position/skin/hair/outfit, so a person keeps the same clothes on every render.
  function person(o) {
    const sk = SKIN[o.skin || 'b'], hc = HAIRC[o.hc || 'k'], pose = o.pose || 'stand';
    const outfit = o.outfit || 'tee', hair = o.hair || 'short', acc = o.acc || [];
    const h = hash((o.x || 0) + '|' + (o.skin || '') + '|' + hair + '|' + outfit);
    const shirt = o.shirt || SHIRTS[h % SHIRTS.length], pants = o.pants || PANTS[(h >>> 3) % PANTS.length];
    const sleeve = outfit === 'dress' ? sk : shirt;
    const seated = pose === 'sit' || o.sit === true, wheel = pose === 'wheel';
    // HY = head-centre y; dy = how far the upper body is lowered when seated (18) or in a wheelchair (30).
    const HY = -128, dy = seated ? 18 : wheel ? 30 : 0;
    let hback = '', back = '', legs = '', body = '', arms = '', head = '', front = '', extra = '';
    const wood = '#9a6b45';

    // Hair that sits BEHIND the head (hback); front hair/caps/hats are added to `front` further down.
    if (hair === 'locs') hback += [-17, -11, -5, 5, 11, 17].map(x => `<path d="M${x},${HY - 6} Q${x * 1.15},${HY + 18} ${x * 1.1},${HY + 38}" fill="none" stroke="${hc}" stroke-width="6.5" stroke-linecap="round"/>`).join('');
    if (hair === 'afro') hback += `<circle cx="0" cy="${HY - 6}" r="27" fill="${hc}"/>`;
    if (hair === 'long' || hair === 'braids') hback += `<path d="M-19,${HY} Q-24,${HY + 36} -14,${HY + 34} L14,${HY + 34} Q24,${HY + 36} 19,${HY}Z" fill="${hc}"/>`;
    if (hair === 'hijab') hback += `<path d="M-23,${HY} Q-26,${HY - 30} 0,${HY - 31} Q26,${HY - 30} 23,${HY} Q24,${HY + 22} 16,${HY + 30} L0,${HY + 36} L-16,${HY + 30} Q-24,${HY + 22} -23,${HY}Z" fill="${LT}"/>` + shade(`M0,${HY - 31} Q26,${HY - 30} 23,${HY} Q24,${HY + 22} 16,${HY + 30} L0,${HY + 36}Z`, LT);

    // Legs/lower body: one branch per posture (seated on a seat type, wheelchair, dress, walking, default standing).
    if (seated) {
      /* o.seat: 'chair' (default) | 'stone' | 'none' */
      if (o.seat === 'stone') legs += `<path d="M-50,0 Q-56,-32 -30,-44 Q4,-56 36,-44 Q56,-32 50,0Z" fill="#474c47"/><path d="M10,-52 Q36,-46 46,-26 Q52,-10 50,0 H18 Q30,-24 10,-52Z" fill="${darken('#474c47', .2)}"/><path d="M-40,-14 q10,-8 20,-3 M-30,-34 q10,-6 20,-2" fill="none" stroke="#9aa39a" stroke-width="1.8" stroke-linecap="round"/>`;
      else if (o.seat === 'rocker') legs += `<path d="M-30,-100 L-22,-40 M-24,-96 L-17,-44" fill="none" stroke="${wood}" stroke-width="5" stroke-linecap="round"/><rect x="-26" y="-42" width="60" height="6" rx="2" fill="${wood}"/><path d="M-20,-38 L-16,-6 M28,-38 L26,-6" fill="none" stroke="${wood}" stroke-width="4"/><path d="M-38,-12 Q-4,4 42,-10" fill="none" stroke="${darken(wood, .2)}" stroke-width="5" stroke-linecap="round"/>`;
      else if (o.seat === 'cajon' || o.seat === 'step') { const sc = o.seat === 'cajon' ? '#8A5A3C' : '#a9a29a'; legs += `<rect x="-30" y="-42" width="${o.seat === 'step' ? 70 : 46}" height="42" rx="2" fill="${sc}"/><rect x="-30" y="-42" width="${o.seat === 'step' ? 70 : 46}" height="5" fill="${darken(sc, .2)}"/>`; }
      else if (o.seat !== 'none') legs += `<rect x="-26" y="-98" width="5" height="60" rx="2" fill="${wood}"/><rect x="-26" y="-42" width="60" height="6" rx="2" fill="${wood}"/><rect x="-24" y="-38" width="4" height="38" fill="${wood}"/><rect x="26" y="-38" width="4" height="38" fill="${wood}"/>`;
      legs += `<rect x="-14" y="-56" width="42" height="15" rx="7" fill="${pants}"/><rect x="14" y="-46" width="14" height="46" rx="6" fill="${pants}"/><ellipse cx="31" cy="-2" rx="11" ry="5" fill="${INKD}"/>`;
    } else if (wheel) {
      legs += `<circle cx="-6" cy="-27" r="25" fill="none" stroke="#44505c" stroke-width="3.5"/><circle cx="-6" cy="-27" r="4" fill="#44505c"/><circle cx="38" cy="-7" r="7" fill="none" stroke="#44505c" stroke-width="3"/>`;
      legs += `<rect x="-26" y="-98" width="4" height="64" rx="2" fill="#44505c"/><rect x="-26" y="-38" width="56" height="5" rx="2" fill="#44505c"/>`;
      legs += `<rect x="-12" y="-52" width="40" height="15" rx="7" fill="${pants}"/><rect x="14" y="-46" width="13" height="38" rx="6" fill="${pants}"/><ellipse cx="34" cy="-6" rx="10" ry="4" fill="${INKD}"/>`;
    } else if (outfit === 'dress') {
      legs += `<rect x="-9" y="-34" width="6" height="33" fill="${sk}"/><rect x="3" y="-34" width="6" height="33" fill="${sk}"/><ellipse cx="-9" cy="-1" rx="9" ry="4.5" fill="${INKD}"/><ellipse cx="9" cy="-1" rx="9" ry="4.5" fill="${INKD}"/>`;
    } else if (pose === 'walk') {
      legs += `<rect x="-16" y="-60" width="14" height="58" rx="6" fill="${pants}" transform="rotate(14 -9 -60)"/><rect x="2" y="-60" width="14" height="58" rx="6" fill="${pants}" transform="rotate(-14 9 -60)"/>`;
      legs += `<ellipse cx="-24" cy="-1" rx="10" ry="4.5" fill="${INKD}"/><ellipse cx="24" cy="-1" rx="10" ry="4.5" fill="${INKD}"/>`;
    } else {
      legs += `<rect x="-16" y="-60" width="14" height="58" rx="6" fill="${pants}"/><rect x="2" y="-60" width="14" height="58" rx="6" fill="${pants}"/><rect x="2" y="-60" width="14" height="58" rx="6" fill="${darken(pants, .15)}"/>`;
      legs += `<ellipse cx="-10" cy="-1" rx="10" ry="4.5" fill="${INKD}"/><ellipse cx="10" cy="-1" rx="10" ry="4.5" fill="${INKD}"/>`;
    }

    // Torso by outfit (dress/coat/default tee shape), then outfit and accessory overlays that draw on the torso.
    if (outfit === 'dress') { body += `<path d="M-18,-104 Q0,-110 18,-104 L30,-34 Q0,-26 -30,-34Z" fill="${shirt}"/>` + shade('M0,-107 Q9,-107 18,-104 L30,-34 Q15,-30 0,-29Z', shirt); }
    else if (outfit === 'coat') { body += `<path d="M-21,-104 Q0,-110 21,-104 L24,-30 Q0,-24 -24,-30Z" fill="${shirt}"/>` + shade('M0,-107 Q10,-107 21,-104 L24,-30 Q12,-27 0,-27Z', shirt) + line('M0,-106 V-28', darken(shirt, .35), 1.4); }
    else { body += `<path d="M-20,-104 Q0,-110 20,-104 L17,-56 Q0,-50 -17,-56Z" fill="${shirt}"/>` + shade('M0,-107 Q10,-107 20,-104 L17,-56 Q8,-53 0,-52Z', shirt); }
    if (outfit === 'apron' || acc.includes('apron')) body += `<path d="M-12,-92 H12 L14,-50 H-14Z" fill="${LT}"/>` + shade('M0,-92 H12 L14,-50 H0Z', LT);
    if (outfit === 'stripe') body += line('M-19,-92 H19 M-18,-80 H18 M-17,-68 H17', lighten(shirt, .45), 3);
    if (outfit === 'tie') body += `<path d="M0,-104 L-4,-96 L0,-70 L4,-96Z" fill="#B5384A"/>`;
    if (outfit === 'guayabera') body += line('M-11,-100 V-58 M-7,-100 V-58 M7,-100 V-58 M11,-100 V-58', darken(shirt, .18), 1.1);
    if (outfit === 'scrubs') body += line('M-8,-106 L0,-95 L8,-106', darken(shirt, .3), 1.6);
    if (outfit === 'blazer') body += `<path d="M-7,-106 L0,-84 L7,-106Z" fill="${LT}"/><path d="M-9,-106 L-1,-82 L-13,-94Z M9,-106 L1,-82 L13,-94Z" fill="${darken(shirt, .22)}"/>`;
    if (outfit === 'vest') body += line('M-8,-106 L0,-80 L8,-106', darken(shirt, .35), 1.6);

    // Arms: hand() draws a hand (cream if gloves); A(path, hx, hy) = sleeve-coloured stroke + hand. L/R pick the left/right arm
    // shape from `pose`; walk mirrors the left arm, and wheelchair users get both hands on the wheels (overrides below).
    const hk = acc.includes('gloves') ? LT : sk, hand = (x, y) => `<circle cx="${x}" cy="${y}" r="5.4" fill="${hk}"/><ellipse cx="${x + (x < 0 ? -4 : 4)}" cy="${y - 2}" rx="2" ry="3.4" fill="${hk}"/>`;
    const A = (d, hx, hy) => `<path d="${d}" fill="none" stroke="${sleeve}" stroke-width="9" stroke-linecap="round"/>` + hand(hx, hy);
    const L = pose === 'dance' ? A('M-20,-102 Q-40,-92 -42,-70', -42, -68) : pose === 'cheer' ? A('M-20,-102 Q-38,-118 -36,-146', -36, -150) : pose === 'hold' || pose === 'carry' ? A('M-20,-102 Q-28,-84 -8,-78', -8, -78) : A('M-20,-102 Q-30,-82 -27,-64', -27, -62);
    let R;
    if (pose === 'dance') R = A('M20,-102 Q40,-92 42,-70', 42, -68);
    else if (pose === 'whistle') { R = `<path d="M20,-102 Q34,-84 8,-104" fill="none" stroke="${sleeve}" stroke-width="9" stroke-linecap="round"/>`; extra += `<circle cx="5" cy="-106" r="5.4" fill="${hk}"/><rect x="1.6" y="-120" width="3.6" height="12" rx="1.8" fill="${hk}"/>`; }
    else if (pose === 'wave') R = A('M20,-102 Q40,-108 40,-134', 40, -138);
    else if (pose === 'cheer') R = A('M20,-102 Q38,-118 36,-146', 36, -150);
    else if (pose === 'point') R = A('M20,-102 L54,-112', 56, -113);
    else if (pose === 'think') R = A('M20,-102 Q34,-84 8,-110', 8, -112);
    else if (pose === 'hold' || pose === 'carry') R = A('M20,-102 Q28,-84 8,-78', 8, -78);
    else if (pose === 'walk') R = A('M20,-102 Q32,-84 34,-66', 34, -64);
    else R = A('M20,-102 Q30,-82 27,-64', 27, -62);
    if (pose === 'walk') arms += A('M-20,-102 Q-32,-84 -34,-66', -34, -64) + R; else arms += L + R;
    if (wheel) arms = A('M-20,-102 Q-30,-80 -8,-50', -8, -48) + A('M20,-102 Q30,-84 14,-52', 14, -50);

    // Head: face disc + darker half, eyes/brows/nose/mouth. The head group is scaled 1.22x later (HT) for a friendlier proportion.
    head += hair === 'hijab' ? `<ellipse cx="0" cy="${HY}" rx="13" ry="15.5" fill="${sk}"/>` + shade(`M0,${HY - 15.5} A13 15.5 0 0 1 0,${HY + 15.5}Z`, sk) : `<circle cx="0" cy="${HY}" r="17" fill="${sk}"/>` + shade(`M0,${HY - 17} A17 17 0 0 1 0,${HY + 17}Z`, sk);
    const ears = hair === 'hijab' ? '' : `<circle cx="-17" cy="${HY + 3}" r="4" fill="${darken(sk, .08)}"/><circle cx="17" cy="${HY + 3}" r="4" fill="${darken(sk, .08)}"/>`;
    const bc = ['g', 'w'].includes(o.hc) ? '#8a8a8a' : darken(hc, .0);
    head += `<circle cx="-6" cy="${HY + 1}" r="2" fill="${DK}"/><circle cx="6" cy="${HY + 1}" r="2" fill="${DK}"/>` + line(`M-9,${HY - 4} q3,-2 6,0 M3,${HY - 4} q3,-2 6,0`, bc, 1.5) + `` + `<path d="M-1.5,${HY + 3} q-1.5,4 1.5,4.5" fill="none" stroke="${darken(sk, .3)}" stroke-width="1.4" stroke-linecap="round"/>`;
    head += line(`M-4,${HY + 9} Q0,${HY + 12} 4,${HY + 9}`, DK, 1.6) + line(`M0,${HY + 3} v3`, darken(sk, .3), 1.2);

    // Front hair / headwear / face accessories (drawn on top of the head). `cap` is the shared hairline path for most styles.
    const cap = `M-18,${HY - 3} Q-19,${HY - 24} 0,${HY - 24} Q19,${HY - 24} 18,${HY - 3} Q8,${HY - 11} -18,${HY - 3}Z`;
    if (['short', 'long', 'bun', 'braids', 'ponytail', 'bob'].includes(hair)) front += `<path d="${cap}" fill="${hc}"/>`;
    if (hair === 'bob') front += `<path d="M-18,${HY - 3} Q-22,${HY + 14} -14,${HY + 14} L-12,${HY - 4}Z M18,${HY - 3} Q22,${HY + 14} 14,${HY + 14} L12,${HY - 4}Z" fill="${hc}"/>`;
    if (hair === 'curly') front += [[-12, -14], [0, -21], [12, -14], [-17, -4], [17, -4]].map(p => `<circle cx="${p[0]}" cy="${HY + p[1]}" r="8" fill="${hc}"/>`).join('');
    if (hair === 'bun') front += `<circle cx="0" cy="${HY - 30}" r="8" fill="${hc}"/>`;
    if (hair === 'braids') front += `<path d="M-15,${HY + 8} L-19,${HY + 36} M15,${HY + 8} L19,${HY + 36}" fill="none" stroke="${hc}" stroke-width="7" stroke-linecap="round"/><circle cx="-19" cy="${HY + 38}" r="4" fill="${hc}"/><circle cx="19" cy="${HY + 38}" r="4" fill="${hc}"/>`;
    if (hair === 'ponytail') front += `<path d="M15,${HY - 12} Q36,${HY - 14} 30,${HY + 14}" fill="none" stroke="${hc}" stroke-width="8" stroke-linecap="round"/>`;
    if (hair === 'turban') front += `<path d="M-18,${HY - 3} Q-20,${HY - 28} 0,${HY - 28} Q20,${HY - 28} 18,${HY - 3} Q0,${HY - 10} -18,${HY - 3}Z" fill="${LT}"/>` + line(`M-16,${HY - 10} Q0,${HY - 22} 16,${HY - 12} M-12,${HY - 20} Q2,${HY - 14} 14,${HY - 22}`, '#cbbfae', 2);
    if (hair === 'cap') front += `<path d="M-18,${HY - 3} Q-19,${HY - 24} 0,${HY - 24} Q19,${HY - 24} 18,${HY - 3}Z" fill="${shirt}"/><path d="M10,${HY - 4} H34" stroke="${shirt}" stroke-width="5" stroke-linecap="round"/>`;
    if (hair === 'kippah') front += `<path d="M-9,${HY - 16} Q0,${HY - 26} 9,${HY - 16}Z" fill="#1f3a5c"/>`;

    if (hair === 'fade') front += `<path d="M-17.5,${HY - 1} Q-19,${HY - 22} 0,${HY - 22} Q19,${HY - 22} 17.5,${HY - 1} Q17,${HY - 10} 12,${HY - 12} Q0,${HY - 15} -12,${HY - 12} Q-17,${HY - 10} -17.5,${HY - 1}Z" fill="${hc}"/>`;
    if (hair === 'locs' || hair === 'puff') front += `<path d="${cap}" fill="${hc}"/>`;
    if (hair === 'locs') front += `<path d="M-18,${HY - 6} Q-21,${HY + 14} -20,${HY + 32} M18,${HY - 6} Q21,${HY + 14} 20,${HY + 32}" fill="none" stroke="${hc}" stroke-width="6.5" stroke-linecap="round"/>`;
    if (hair === 'puff') front += `<circle cx="0" cy="${HY - 30}" r="14" fill="${hc}"/>`;
    if (hair === 'wrap') { const wc = o.wrapc || '#E06D53'; front += `<path d="M-19,${HY - 1} Q-23,${HY - 30} 0,${HY - 32} Q23,${HY - 30} 19,${HY - 1} Q0,${HY - 11} -19,${HY - 1}Z" fill="${wc}"/><path d="M-3,${HY - 29} Q-20,${HY - 50} -6,${HY - 48} Q0,${HY - 42} 2,${HY - 30}Z M1,${HY - 30} Q14,${HY - 52} 20,${HY - 38} Q12,${HY - 32} 1,${HY - 30}Z" fill="${darken(wc, .12)}"/>` + line(`M-17,${HY - 10} Q0,${HY - 22} 17,${HY - 12} M-13,${HY - 20} Q2,${HY - 14} 15,${HY - 22}`, darken(wc, .3), 1.4); }
    if (acc.includes('eyesclosed')) front += `<circle cx="-6" cy="${HY + 1}" r="2.7" fill="${sk}"/><circle cx="6" cy="${HY + 1}" r="2.7" fill="${darken(sk)}"/>` + line(`M-8.5,${HY + 1} q2.5,2 5,0 M3.5,${HY + 1} q2.5,2 5,0`, DK, 1.4);
    if (acc.includes('sing')) front += `<ellipse cx="0" cy="${HY + 10}" rx="3.6" ry="4" fill="${DK}"/>`;
    if (acc.includes('earrings')) front += `<circle cx="-17" cy="${HY + 10}" r="2.6" fill="none" stroke="#E8A23B" stroke-width="1.6"/><circle cx="17" cy="${HY + 10}" r="2.6" fill="none" stroke="#E8A23B" stroke-width="1.6"/>`;
    if (acc.includes('wig')) front += `<path d="M-19,${HY - 2} Q-20,${HY - 26} 0,${HY - 26} Q20,${HY - 26} 19,${HY - 2} Q8,${HY - 12} -19,${HY - 2}Z" fill="${LT}"/>` + [-1, 1].map(s => [2, 12, 22].map(y => `<circle cx="${s * 21}" cy="${HY + y}" r="5.5" fill="${s > 0 ? darken(LT) : LT}"/>`).join('')).join('') + line(`M-14,${HY - 14} q4,-4 8,0 q4,-4 8,0 q4,-4 8,0`, '#B8AE9F', 1.3);
    if (acc.includes('hardhat')) { const hh = o.hatc || '#F2B84B'; front += `<path d="M-19,${HY - 8} Q-19,${HY - 33} 0,${HY - 33} Q19,${HY - 33} 19,${HY - 8}Z" fill="${hh}"/><path d="M0,${HY - 33} Q19,${HY - 33} 19,${HY - 8} H0Z" fill="${darken(hh, .12)}"/><rect x="-24" y="${HY - 11}" width="48" height="5" rx="2.5" fill="${darken(hh, .2)}"/>` + line(`M0,${HY - 33} V${HY - 10}`, darken(hh, .3), 1.4); }
    if (acc.includes('glasses')) front += `<circle cx="-7" cy="${HY + 1}" r="5.5" fill="none" stroke="${DK}" stroke-width="1.8"/><circle cx="7" cy="${HY + 1}" r="5.5" fill="none" stroke="${DK}" stroke-width="1.8"/>` + line(`M-1.5,${HY + 1} H1.5`, DK, 1.8);
    const greyH = ['g', 'w'].includes(o.hc), fh = greyH ? '#a9a9a9' : hc, fs = greyH ? ` stroke="${DK}" stroke-width="1.3" stroke-linejoin="round"` : '';
    if (acc.includes('beard')) front += `<path d="M-15,${HY + 4} Q-14,${HY + 28} 0,${HY + 28} Q14,${HY + 28} 15,${HY + 4} Q0,${HY + 18} -15,${HY + 4}Z" fill="${fh}"${fs}/>`;
    if (acc.includes('mustache')) front += `<path d="M-12,${HY + 9} Q-9,${HY + 3} 0,${HY + 4.5} Q9,${HY + 3} 12,${HY + 9} Q6,${HY + 7.5} 0,${HY + 9.5} Q-6,${HY + 7.5} -12,${HY + 9}Z" fill="${fh}"${fs}/>`;
    if (acc.includes('hat')) { const st = o.hatc || '#D9B56A'; front += `<ellipse cx="0" cy="${HY - 16}" rx="32" ry="6" fill="${st}"/><path d="M-16,${HY - 17} Q-14,${HY - 38} 0,${HY - 38} Q14,${HY - 38} 16,${HY - 17}Z" fill="${st}"/><path d="M0,${HY - 38} Q14,${HY - 38} 16,${HY - 17} H0Z" fill="${darken(st, .12)}"/><path d="M-16,${HY - 20} H16" stroke="#8A3A2A" stroke-width="4"/>` + line(`M-11,${HY - 27} q11,-3 22,0 M-8,${HY - 33} q8,-2 16,0 M-26,${HY - 16} q26,5 52,0`, '#5a3d10', 1.1); }
    // Body-level accessories (vests, scarf, bags, stethoscope...) are appended to body/back/extra rather than the head.
    if (acc.includes('hivis')) body += `<path d="M-20,-104 L-7,-105 L-4,-54 L-17,-56Z M20,-104 L7,-105 L4,-54 L17,-56Z" fill="#E3D23A"/>` + line('M-18,-78 H-6 M6,-78 H18 M-17,-66 H-5 M5,-66 H17', '#F7F2EA', 3);
    if (acc.includes('lifevest')) body += `<path d="M-21,-104 L-6,-106 L-5,-56 L-18,-57Z M21,-104 L6,-106 L5,-56 L18,-57Z" fill="#E8742B"/>` + line('M-6,-90 H6 M-6,-74 H6', '#2b2b2b', 2);
    if (acc.includes('flowers')) body += [[-12, -88], [6, -80], [-6, -64], [14, -58], [-16, -48], [4, -44], [18, -40]].map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="${i % 2 ? '#F2B84B' : LT}"/>`).join('');
    if (acc.includes('scarf')) body += `<path d="M-15,-108 Q0,-98 15,-108 L13,-98 Q0,-90 -13,-98Z" fill="#E06D53"/><path d="M8,-98 L12,-80" stroke="#E06D53" stroke-width="5" stroke-linecap="round"/>`;
    if (acc.includes('headphones')) front += `<path d="M-19,${HY - 2} Q0,${HY - 34} 19,${HY - 2}" fill="none" stroke="${INKD}" stroke-width="3"/><rect x="-24" y="${HY - 6}" width="9" height="15" rx="4" fill="${INKD}"/><rect x="15" y="${HY - 6}" width="9" height="15" rx="4" fill="${INKD}"/>`;
    if (acc.includes('mask')) front += `<path d="M-13,${HY + 3} H13 Q13,${HY + 17} 0,${HY + 17} Q-13,${HY + 17} -13,${HY + 3}Z" fill="#DCEAF0"/>`;
    const pk = o.packc || '#5B7DB1';
    if (acc.includes('backpack')) { back = `<rect x="-33" y="-102" width="22" height="44" rx="7" fill="${pk}"/><rect x="11" y="-102" width="22" height="44" rx="7" fill="${darken(pk, .15)}"/>` + back; extra += `<path d="M-12,-105 Q-14,-84 -16,-62 M12,-105 Q14,-84 16,-62" fill="none" stroke="${darken(pk, .25)}" stroke-width="3.2" stroke-linecap="round"/>`; }
    if (acc.includes('bag')) extra += `<rect x="16" y="-72" width="24" height="20" rx="4" fill="#B5667A"/><path d="M20,-72 Q28,-84 36,-72" fill="none" stroke="#6e2d3e" stroke-width="2"/>`;
    if (acc.includes('cane')) extra += `<path d="M30,-66 V-2 M30,-66 Q30,-74 38,-72" fill="none" stroke="#6b4a2e" stroke-width="3.5" stroke-linecap="round"/>`;
    if (acc.includes('stethoscope')) body += `<path d="M-8,-106 Q-12,-80 0,-76 Q12,-80 8,-106" fill="none" stroke="#44505c" stroke-width="2.2"/><circle cx="0" cy="-74" r="4" fill="#44505c"/>`;
    if (acc.includes('badge')) body += `<rect x="6" y="-92" width="12" height="8" rx="2" fill="${LT}"/>`;
    if (acc.includes('chef')) front += `<circle cx="-9" cy="${HY - 26}" r="8.5" fill="${LT}"/><circle cx="0" cy="${HY - 32}" r="9.5" fill="${LT}"/><circle cx="9" cy="${HY - 26}" r="8.5" fill="${darken(LT)}"/><rect x="-13" y="${HY - 24}" width="26" height="11" rx="2" fill="${LT}"/><rect x="0" y="${HY - 24}" width="13" height="11" fill="${darken(LT)}"/><rect x="-13" y="${HY - 15}" width="26" height="3" fill="${darken(LT, .08)}"/>`;

    // Assembly: HT scales the head about its centre; stacking order (back to front) is back, back hair, body, collar, folds,
    // neck, arms, head, extras. Legs are drawn first and stay put; seated/wheelchair users shift only the upper body down by dy.
    const neck = `<rect x="-6" y="-116" width="12" height="16" fill="${darken(sk, .12)}"/>`;
    const collar = (outfit === 'tee' || outfit === 'stripe') ? line('M-7,-106 Q0,-98 7,-106', darken(shirt, .3), 1.6) : '';
    const folds = outfit === 'dress' ? line('M-9,-64 q5,5 12,3 M3,-52 q5,4 12,2', darken(shirt, .22), 1.4) : line('M-9,-82 q4,5 10,3 M4,-68 q4,4 9,2', darken(shirt, .2), 1.4);
    const HT = `translate(0,${HY - 5}) scale(1.22) translate(0,${-HY})`;
    const headB = hback ? `<g transform="${HT}">${hback}</g>` : '';
    const headG = `<g transform="${HT}">${ears}${head}${front}</g>`;
    const upper = back + headB + body + collar + folds + neck + arms + headG + extra;
    return legs + ((seated || wheel) ? `<g transform="translate(0,${dy})">${upper}</g>` : upper);
  }

  /* ---------- props: old outline drawings recolored as flat shapes with fine detail lines ---------- */
  // P: object painters, name -> (item) => SVG markup in local coords (feet/base at y=0, centred on x=0). Referenced from
  // scenes as {t:'obj', n:'<name>'}. Shapes carry no fill of their own (they inherit the base colour set by flat());
  // fill="none" paths become fine detail lines, and explicit fills (#F7F2EA, #2b2b2b...) are fixed accent colours.
  // Colours come from PAL below. Adding a prop = add a painter here (or in Object.assign(P, ...) further down) and a PAL entry.
  const INK = '#1d1d1d';
  const P = {
    bread: () => `<path d="M-38,-4 Q-46,-38 -16,-46 Q0,-50 16,-46 Q46,-38 38,-4Z"/><path d="M-18,-34 l8,-9 M-3,-37 l8,-9 M12,-34 l8,-9" fill="none"/>`,
    baguette: () => `<path d="M-52,-14 Q-56,-30 -40,-32 L40,-40 Q58,-42 54,-26 Q52,-12 36,-12Z"/><path d="M-24,-30 l6,-8 M-4,-32 l6,-8 M16,-34 l6,-8 M34,-34 l5,-8" fill="none"/>`,
    cake: () => `<rect x="-34" y="-30" width="68" height="30" rx="5"/><rect x="-24" y="-52" width="48" height="22" rx="5" fill="#F7F2EA"/><path d="M-34,-30 q8,10 17,0 q8,10 17,0 q8,10 17,0" fill="none"/><path d="M-12,-52 V-66 M0,-52 V-68 M12,-52 V-66" fill="none"/><path d="M-12,-68 q-5,-6 0,-10 q5,4 0,10z M0,-70 q-5,-6 0,-10 q5,4 0,10z M12,-68 q-5,-6 0,-10 q5,4 0,10z" fill="#E8A23B"/>`,
    umbrella: () => `<path d="M-48,-58 Q-48,-112 0,-112 Q48,-112 48,-58 Q32,-70 16,-58 Q0,-70 -16,-58 Q-32,-70 -48,-58Z"/><path d="M0,-112 V-8 Q0,2 -10,1" fill="none"/>`,
    bus: () => `<rect x="-64" y="-76" width="128" height="62" rx="12"/><rect x="-54" y="-66" width="24" height="22" rx="3" fill="#F7F2EA"/><rect x="-22" y="-66" width="24" height="22" rx="3" fill="#F7F2EA"/><rect x="10" y="-66" width="24" height="22" rx="3" fill="#F7F2EA"/><rect x="40" y="-66" width="16" height="34" rx="3" fill="#F7F2EA"/><path d="M-64,-36 H34" fill="none"/><circle cx="-36" cy="-12" r="12" fill="#2b2b2b"/><circle cx="36" cy="-12" r="12" fill="#2b2b2b"/><circle cx="-36" cy="-12" r="5" fill="#cfcfcf"/><circle cx="36" cy="-12" r="5" fill="#cfcfcf"/>`,
    train: () => `<path d="M-76,-14 V-70 Q-76,-82 -64,-82 H50 Q76,-82 76,-50 V-14Z"/><rect x="-66" y="-68" width="22" height="22" rx="3" fill="#F7F2EA"/><rect x="-34" y="-68" width="22" height="22" rx="3" fill="#F7F2EA"/><rect x="-2" y="-68" width="22" height="22" rx="3" fill="#F7F2EA"/><path d="M40,-72 L62,-72 Q68,-60 68,-50 H40Z" fill="#F7F2EA"/><path d="M-76,-30 H76" fill="none"/><circle cx="-48" cy="-10" r="9" fill="#2b2b2b"/><circle cx="-20" cy="-10" r="9" fill="#2b2b2b"/><circle cx="30" cy="-10" r="9" fill="#2b2b2b"/><circle cx="58" cy="-10" r="9" fill="#2b2b2b"/>`,
    bike: () => `<circle cx="-36" cy="-24" r="24" fill="none"/><circle cx="36" cy="-24" r="24" fill="none"/><path d="M-36,-24 L-6,-24 L-20,-58 L18,-58 L36,-24 M-6,-24 L18,-58 M18,-58 L26,-70 H38 M-26,-62 H-12" fill="none"/>`,
    phone: () => `<rect x="-20" y="-84" width="40" height="76" rx="8"/><rect x="-14" y="-74" width="28" height="48" rx="3" fill="#BCD7E0"/><circle cx="0" cy="-16" r="3.5" fill="#8a9aa8"/>`,
    book: () => `<path d="M0,-10 Q-26,-22 -50,-12 V-56 Q-26,-66 0,-52 Q26,-66 50,-56 V-12 Q26,-22 0,-10Z"/><path d="M0,-52 V-10" fill="none"/>`,
    closedbook: () => `<rect x="-30" y="-70" width="60" height="70" rx="4"/><path d="M-20,-70 V0 M-8,-52 H20 M-8,-42 H16" fill="none"/>`,
    camera: () => `<rect x="-34" y="-54" width="68" height="42" rx="7"/><rect x="-14" y="-64" width="28" height="10" rx="3"/><circle cx="0" cy="-32" r="14" fill="#cfd8e0"/><circle cx="0" cy="-32" r="6" fill="#2b3138"/><circle cx="24" cy="-44" r="2.5" fill="#F7F2EA"/>`,
    clock: () => `<circle cx="0" cy="-48" r="42"/><path d="M0,-48 V-76 M0,-48 L20,-38 M0,-86 v6 M0,-16 v-6 M-42,-48 h6 M42,-48 h-6" fill="none"/><circle cx="0" cy="-48" r="3" fill="#44505c"/>`,
    tree: () => `<path d="M-6,0 V-46 M6,0 V-46" fill="none" stroke="#6b4a2e" stroke-width="9"/><path d="M-34,-52 Q-54,-74 -28,-90 Q-20,-118 4,-106 Q32,-114 36,-88 Q58,-72 32,-52 Q0,-40 -34,-52Z"/>`,
    plant: () => `<path d="M-20,-34 H20 L14,0 H-14Z" fill="#C2813D"/><path d="M0,-34 V-90 M0,-34 Q-30,-50 -26,-80 Q0,-66 0,-34 M0,-34 Q30,-50 26,-80 Q0,-66 0,-34" fill="none"/>`,
    flowers: () => `<path d="M-20,0 V-52 M0,0 V-66 M20,0 V-48 M0,-20 Q-12,-26 -20,-34 M0,-24 Q12,-30 20,-38" fill="none" stroke="#4f7a4b" stroke-width="2.5"/><circle cx="-20" cy="-60" r="10"/><circle cx="0" cy="-76" r="11" fill="#E06D53"/><circle cx="20" cy="-57" r="10" fill="#B5667A"/><circle cx="-20" cy="-60" r="3" fill="#7a5412"/><circle cx="0" cy="-76" r="3" fill="#7a5412"/><circle cx="20" cy="-57" r="3" fill="#7a5412"/>`,
    cup: () => `<path d="M-24,-46 H24 V-22 Q24,0 0,0 Q-24,0 -24,-22Z"/><path d="M24,-38 Q44,-38 44,-24 Q44,-12 24,-12" fill="none" stroke="#B8AE9F" stroke-width="4"/><path d="M-9,-58 q-7,-9 0,-18 M9,-58 q-7,-9 0,-18" fill="none"/>`,
    stall: () => `<rect x="-62" y="-42" width="124" height="42" rx="4" fill="#C2813D"/><path d="M-68,-104 H68 L74,-70 H-74Z"/><path d="M-46,-104 L-48,-70 M-23,-104 L-24,-70 M0,-104 V-70 M23,-104 L24,-70 M46,-104 L48,-70" fill="none" stroke="#F7F2EA" stroke-width="3"/><path d="M-60,-70 V-42 M60,-70 V-42" fill="none"/>`,
    suitcase: () => `<rect x="-32" y="-62" width="64" height="54" rx="8"/><path d="M-12,-62 V-74 H12 V-62 M-16,-62 V-8 M16,-62 V-8" fill="none"/><circle cx="-20" cy="-4" r="4" fill="#2b3138"/><circle cx="20" cy="-4" r="4" fill="#2b3138"/>`,
    house: () => `<rect x="-46" y="-62" width="92" height="62"/><path d="M-58,-62 L0,-108 L58,-62Z" fill="#C2653F"/><rect x="-10" y="-36" width="20" height="36" fill="#8A5A3C"/><rect x="22" y="-52" width="16" height="16" fill="#BCD7E0"/><rect x="-38" y="-52" width="16" height="16" fill="#BCD7E0"/>`,
    window: () => `<rect x="-34" y="-84" width="68" height="84" rx="3"/><path d="M0,-84 V0 M-34,-42 H34" fill="none" stroke="#F1E8DB" stroke-width="3"/>`,
    envelope: () => `<rect x="-36" y="-50" width="72" height="48" rx="4"/><path d="M-36,-50 L0,-22 L36,-50" fill="none"/>`,
    key: () => `<circle cx="-26" cy="-34" r="14"/><circle cx="-26" cy="-34" r="4" fill="#F7F2EA"/><path d="M-12,-34 H40 M28,-34 V-20 M38,-34 V-22" fill="none" stroke="#E8A23B" stroke-width="5"/>`,
    wallet: () => `<rect x="-36" y="-52" width="72" height="46" rx="9"/><path d="M14,-40 H36 V-24 H14Z" fill="#B07A55"/><circle cx="24" cy="-32" r="3" fill="#F7F2EA"/>`,
    ball: () => `<circle cx="0" cy="-32" r="32"/><path d="M0,-46 L13,-36 L8,-20 H-8 L-13,-36Z" fill="#2a2a2a"/><path d="M0,-46 V-62 M13,-36 L28,-42 M8,-20 L16,-8 M-8,-20 L-16,-8 M-13,-36 L-28,-42" fill="none"/>`,
    guitar: () => `<ellipse cx="0" cy="-26" rx="28" ry="26"/><circle cx="0" cy="-68" r="19"/><rect x="-5" y="-128" width="10" height="46" rx="2" fill="#6b4318"/><rect x="-9" y="-140" width="18" height="14" rx="3" fill="#3a2f2a"/><circle cx="0" cy="-30" r="8" fill="#3a2f2a"/>`,
    mountain: () => `<path d="M-76,0 L-22,-82 L0,-52 L32,-100 L82,0Z"/><path d="M20,-76 L32,-100 L45,-78 L37,-84 L32,-76 L26,-84Z" fill="#F7F2EA"/>`,
    sun: () => `<circle cx="0" cy="-48" r="22"/><path d="M0,-86 v-12 M0,-10 v12 M-38,-48 h-12 M38,-48 h12 M-27,-75 l-9,-9 M27,-75 l9,-9 M-27,-21 l-9,9 M27,-21 l9,9" fill="none"/>`,
    cloud: () => `<path d="M-42,-18 Q-60,-18 -52,-38 Q-48,-56 -28,-50 Q-18,-72 8,-60 Q32,-68 38,-44 Q62,-42 52,-18Z"/>`,
    rain: () => `<path d="M-30,-30 l-6,16 M-10,-34 l-6,16 M10,-30 l-6,16 M30,-34 l-6,16 M-20,-8 l-5,12 M0,-10 l-5,12 M20,-8 l-5,12" fill="none" stroke="#5B8FA0" stroke-width="3"/>`,
    storm: () => `<path d="M-42,-48 Q-60,-48 -52,-68 Q-48,-86 -28,-80 Q-18,-102 8,-90 Q32,-98 38,-74 Q62,-72 52,-48Z"/><path d="M6,-44 L-10,-14 H4 L-6,12 L18,-24 H4Z" fill="#F2B84B"/>`,
    lamp: () => `<path d="M0,-4 V-70 M-18,-4 H18" fill="none" stroke="#7a5412" stroke-width="3"/><path d="M-26,-70 L-14,-100 H14 L26,-70Z"/>`,
    laptop: () => `<rect x="-42" y="-72" width="84" height="54" rx="4"/><rect x="-36" y="-66" width="72" height="42" rx="2" fill="#BCD7E0"/><path d="M-54,-14 H54 L46,-4 H-46Z" fill="#8a97a3"/>`,
    chair: () => `<path d="M-22,-46 H22 M-22,-46 V0 M22,-46 V0 M-22,-46 V-98" fill="none" stroke="#9a6b45" stroke-width="5"/>`,
    table: () => `<rect x="-54" y="-48" width="108" height="8" rx="2"/><path d="M-44,-40 V0 M44,-40 V0" fill="none" stroke="#8A5A3C" stroke-width="6"/>`,
    sofa: () => `<rect x="-52" y="-62" width="104" height="36" rx="10"/><rect x="-62" y="-48" width="22" height="40" rx="8"/><rect x="40" y="-48" width="22" height="40" rx="8"/><path d="M-40,-8 V0 M40,-8 V0" fill="none" stroke="#5E3B26" stroke-width="5"/>`,
    bed: () => `<rect x="-56" y="-36" width="112" height="22" rx="4"/><path d="M-56,-14 V0 M56,-14 V0 M-56,-36 V-64" fill="none" stroke="#8A5A3C" stroke-width="5"/><rect x="-50" y="-48" width="30" height="12" rx="6" fill="#F7F2EA"/>`,
    balloon: () => `<ellipse cx="0" cy="-78" rx="24" ry="30"/><path d="M-4,-48 L4,-48 L0,-42Z"/><path d="M0,-42 q-9,16 0,30 q9,12 0,22" fill="none"/>`,
    flag: () => `<path d="M0,0 V-104" fill="none" stroke="#8a6a3a" stroke-width="3"/><path d="M0,-104 H50 L40,-88 L50,-72 H0Z"/>`,
    dog: () => `<ellipse cx="0" cy="-36" rx="32" ry="18"/><circle cx="36" cy="-54" r="15"/><path d="M42,-68 L54,-56 L46,-52Z" fill="#7a5530"/><ellipse cx="50" cy="-50" rx="7" ry="5" fill="#F7F2EA"/><circle cx="36" cy="-58" r="2" fill="#2a1d16"/><path d="M-20,-20 V0 M-8,-20 V0 M12,-20 V0 M24,-20 V0 M-32,-44 Q-46,-60 -40,-70" fill="none" stroke="#C99A62" stroke-width="6"/>`,
    cat: () => `<ellipse cx="0" cy="-30" rx="28" ry="22"/><ellipse cx="32" cy="-62" rx="20" ry="17"/><path d="M18,-72 L14,-92 L30,-78 M46,-78 L54,-92 L50,-70" fill="#B0A79B" stroke="none"/><circle cx="26" cy="-62" r="2.4" fill="#2a1d16"/><circle cx="38" cy="-62" r="2.4" fill="#2a1d16"/><path d="M-28,-30 Q-52,-32 -46,-58 Q-44,-66 -38,-62" fill="none" stroke="#B0A79B" stroke-width="6"/>`,
    bird: () => `<ellipse cx="0" cy="-34" rx="26" ry="18" transform="rotate(-10 0 -34)"/><circle cx="26" cy="-50" r="11"/><path d="M36,-52 L48,-48 L36,-45Z" fill="#E8A23B"/><circle cx="28" cy="-52" r="2" fill="#2a1d16"/><path d="M-4,-36 Q-20,-52 -30,-40 M-24,-30 L-40,-24 M-6,-17 V-2 M6,-18 V-2" fill="none"/>`,
    bag: () => `<path d="M-28,-60 H28 L32,0 H-32Z"/><path d="M-12,-60 Q-12,-82 0,-82 Q12,-82 12,-60" fill="none"/>`,
    paper: () => `<rect x="-30" y="-74" width="60" height="74" rx="4"/><rect x="-11" y="-80" width="22" height="12" rx="3" fill="#B8AE9F"/><path d="M-18,-52 H18 M-18,-40 H18 M-18,-28 H8" fill="none"/>`,
    mic: () => `<rect x="-11" y="-104" width="22" height="42" rx="11"/><path d="M-20,-78 Q-20,-52 0,-52 Q20,-52 20,-78 M0,-52 V-6 M-20,-6 H20" fill="none"/>`,
    turbine: () => `<path d="M-4,0 L-1,-98 H1 L4,0Z"/><circle cx="0" cy="-102" r="5" fill="#8a9aa8"/><path d="M0,-102 V-152 M0,-102 L-43,-77 M0,-102 L43,-77" fill="none" stroke="#F7F2EA" stroke-width="5" stroke-linecap="round"/>`,
    frame: () => `<rect x="-36" y="-76" width="72" height="60" rx="3"/><rect x="-28" y="-68" width="56" height="44" fill="#BCD7E0"/><path d="M-26,-26 L-10,-50 L0,-38 L12,-54 L26,-26Z" fill="#6B9467" stroke="none"/><circle cx="14" cy="-60" r="4" fill="#F2B84B"/>`,
    star: () => `<path d="M0,-92 L11,-62 L44,-60 L18,-40 L28,-8 L0,-26 L-28,-8 L-18,-40 L-44,-60 L-11,-62Z"/>`,
    moon: () => `<path d="M10,-92 A40,40 0 1 0 10,-8 A32,32 0 1 1 10,-92Z"/>`,
    heart: () => `<path d="M0,-12 C-50,-50 -22,-90 0,-62 C22,-90 50,-50 0,-12Z"/>`,
    ticket: () => `<rect x="-42" y="-52" width="84" height="42" rx="5"/><path d="M12,-52 V-10" stroke-dasharray="4 5" fill="none"/>`,
    map: () => `<path d="M-46,-62 L-16,-52 L16,-62 L46,-52 V-8 L16,-18 L-16,-8 L-46,-18Z"/><path d="M-16,-52 V-8 M16,-62 V-18 M-4,-40 l10,10 m0,-10 l-10,10" fill="none"/>`,
    basket: () => `<path d="M-36,-40 H36 L28,0 H-28Z"/><path d="M-36,-40 Q0,-104 36,-40 M-22,-40 L-18,0 M0,-40 V0 M22,-40 L18,0" fill="none"/>`,
    apple: () => `<circle cx="-8" cy="-26" r="22"/><circle cx="12" cy="-26" r="22"/><path d="M2,-48 Q4,-60 12,-64 M2,-52 Q14,-62 22,-52" fill="none" stroke="#4f7a4b" stroke-width="2.5"/>`,
    lightbulb: () => `<circle cx="0" cy="-72" r="28"/><rect x="-11" y="-44" width="22" height="16" rx="3" fill="#B8AE9F"/><path d="M-14,-22 H14 M-8,-14 H8" fill="none" stroke="#8a8176" stroke-width="3"/><path d="M0,-114 v-12 M-36,-100 l-9,-8 M36,-100 l9,-8" fill="none"/>`,
    bubble: () => `<path d="M-50,-96 H50 Q58,-96 58,-88 V-54 Q58,-46 50,-46 H0 L-22,-26 L-18,-46 H-50 Q-58,-46 -58,-54 V-88 Q-58,-96 -50,-96Z"/><path d="M-34,-80 H34 M-34,-68 H20" fill="none" stroke="#B8AE9F" stroke-width="3"/>`,
    bench: () => `<rect x="-54" y="-38" width="108" height="10" rx="3"/><path d="M-54,-38 V-72 M54,-38 V-72 M-54,-62 H54 M-44,-28 V0 M44,-28 V0" fill="none" stroke="#8A5A3C" stroke-width="5"/>`,
    door: () => `<rect x="-30" y="-104" width="60" height="104" rx="4"/><circle cx="18" cy="-52" r="4" fill="#E8A23B"/><rect x="-20" y="-92" width="40" height="30" rx="3" fill="#744a31"/>`,
    counter: () => `<rect x="-64" y="-40" width="128" height="40" rx="7"/><rect x="-64" y="-44" width="128" height="8" rx="4" fill="#D9A066"/>`,
    boxes: () => `<rect x="-40" y="-36" width="50" height="36"/><rect x="10" y="-28" width="40" height="28" fill="#B07A55"/><rect x="-26" y="-68" width="40" height="32" fill="#D9A066"/><path d="M-15,-36 V-24 M-6,-68 V-56" fill="none"/>`,
    ladder: () => `<path d="M-18,0 L-14,-110 M18,0 L14,-110 M-17,-22 H17 M-16,-46 H16 M-15,-70 H15 M-14,-94 H14" fill="none" stroke="#C99A62" stroke-width="5"/>`,
    pot: () => `<path d="M-32,-44 H32 V-12 Q32,0 20,0 H-20 Q-32,0 -32,-12Z"/><path d="M-32,-36 H-44 M32,-36 H44 M-30,-44 Q0,-58 30,-44" fill="none" stroke="#44505c" stroke-width="3"/><path d="M-10,-62 q-6,-8 0,-16 M10,-62 q-6,-8 0,-16" fill="none" stroke="#B8AE9F" stroke-width="2.5"/>`,
    newspaper: () => `<rect x="-44" y="-62" width="88" height="62" rx="3"/><rect x="-34" y="-52" width="34" height="14" fill="#B8AE9F"/><path d="M6,-50 H36 M6,-42 H36 M-34,-28 H36 M-34,-18 H36" fill="none" stroke="#8a8176" stroke-width="3"/>`,
    trophy: () => `<path d="M-24,-96 H24 V-72 Q24,-48 0,-46 Q-24,-48 -24,-72Z"/><path d="M-24,-88 H-38 Q-38,-64 -22,-62 M24,-88 H38 Q38,-64 22,-62 M0,-46 V-16 M-16,-16 H16 V0 H-16Z" fill="none"/>`,
    boat: () => `<path d="M-56,-24 H56 L40,0 H-40Z"/><path d="M0,-24 V-100 M0,-96 L40,-36 H0 M-4,-90 L-34,-36 H-4" fill="#F7F2EA" stroke="#8a97a3" stroke-width="2"/>`,
    candle: () => `<rect x="-8" y="-50" width="16" height="50" rx="2"/><path d="M0,-72 q-8,-10 0,-20 q8,10 0,20z" fill="#E8A23B"/><path d="M0,-50 V-60" fill="none"/>`,
    bell: () => `<path d="M-30,-18 Q-30,-70 0,-76 Q30,-70 30,-18Z"/><path d="M-34,-18 H34" fill="none"/><circle cx="0" cy="-10" r="5" fill="#c98512"/>`,
    podium: () => `<path d="M-34,0 L-26,-70 H26 L34,0Z"/><path d="M-26,-58 H26" fill="none"/>`,
    watch: () => `<circle cx="0" cy="-48" r="20"/><path d="M0,-48 V-58 M0,-48 L8,-44" fill="none"/><path d="M-10,-68 L-8,-92 M10,-68 L8,-92 M-10,-28 L-8,-4 M10,-28 L8,-4" fill="none" stroke="#8A5A3C" stroke-width="6"/>`,
    pencil: () => `<path d="M-6,-4 L-6,-92 L6,-92 L6,-4 L0,8Z"/><path d="M-6,-80 H6 M-6,-12 H6" fill="none"/>`,
    backpack: () => `<path d="M-26,-6 V-58 Q-26,-80 0,-80 Q26,-80 26,-58 V-6 Q26,0 20,0 H-20 Q-26,0 -26,-6Z"/><path d="M-26,-58 Q0,-66 26,-58 L24,-40 Q0,-34 -24,-40Z" fill="#1d1d1d"/><rect x="-16" y="-30" width="32" height="20" rx="5" fill="none"/><circle cx="0" cy="-42" r="3" fill="#fff"/><path d="M-8,-80 Q0,-94 8,-80 M-24,-40 Q0,-34 24,-40 M-16,-24 H16" fill="none"/><path d="M-28,-60 Q-38,-34 -28,-8 M28,-60 Q38,-34 28,-8" fill="none"/>`,
    note: () => `<path d="M-14,-4 V-70 L24,-80 V-14" fill="none" stroke="#44505c" stroke-width="3"/><ellipse cx="-22" cy="-6" rx="10" ry="7" fill="#44505c"/><ellipse cx="16" cy="-14" rx="10" ry="7" fill="#44505c"/>`,
    ground: () => ``
  };
  // PAL: prop name -> [base fill, detail-line colour]. A scene item can override with its own `c`.
  // Props missing here fall back to a colour pair from FREE chosen by hash(name), so a missing entry still renders.
  /* [base, detail line] per prop */
  const PAL = {
    bread: ['#D9A066', '#9C6A33'], baguette: ['#E0B070', '#9C6A33'], cake: ['#F3C6CF', '#B5667A'], umbrella: ['#E06D53', '#7f3524'], bus: ['#E8A23B', '#7a5412'], train: ['#5B7DB1', '#2c4468'], bike: ['#4D6A8A', '#2c4468'],
    phone: ['#44505c', '#1f2730'], book: ['#5B7DB1', '#2c4468'], closedbook: ['#B5667A', '#6e2d3e'], camera: ['#5a6570', '#2b3138'], clock: ['#F7F2EA', '#44505c'], tree: ['#6B9467', '#3f5f3d'], plant: ['#6B9467', '#3f5f3d'],
    flowers: ['#F2B84B', '#4f7a4b'], cup: ['#F7F2EA', '#8a8176'], stall: ['#E06D53', '#7f3524'], suitcase: ['#4D6A8A', '#2c4468'], house: ['#E8D3B0', '#8a6a3a'], window: ['#BCD7E0', '#5B8FA0'], envelope: ['#F7F2EA', '#8a8176'],
    key: ['#E8A23B', '#7a5412'], wallet: ['#8A5A3C', '#4a2f1f'], ball: ['#F7F2EA', '#2a2a2a'], guitar: ['#C2813D', '#6b4318'], mountain: ['#8FA3B5', '#4a5f73'], sun: ['#F2B84B', '#c98512'], cloud: ['#DDE7EE', '#9fb1bf'],
    rain: ['#BCD7E0', '#5B8FA0'], storm: ['#9fb1bf', '#44505c'], lamp: ['#E8A23B', '#7a5412'], laptop: ['#B8C2CC', '#4a5560'], chair: ['#9a6b45', '#5E3B26'], table: ['#8A5A3C', '#5E3B26'], sofa: ['#7A9E7E', '#44684a'],
    bed: ['#9DB8D9', '#4a6a92'], balloon: ['#E06D53', '#7f3524'], flag: ['#E06D53', '#7f3524'], dog: ['#C99A62', '#7a5530'], cat: ['#B0A79B', '#5a5248'], bird: ['#5B9BD5', '#2c5d8a'], bag: ['#B5667A', '#6e2d3e'],
    paper: ['#F7F2EA', '#8a8176'], mic: ['#5a6570', '#2b3138'], turbine: ['#F7F2EA', '#8a9aa8'], frame: ['#E8D3B0', '#8A5A3C'], star: ['#F2B84B', '#c98512'], moon: ['#F2D98B', '#b8962e'], heart: ['#E06D53', '#8a2f1d'],
    ticket: ['#E8A23B', '#7a5412'], map: ['#E8D3B0', '#8a6a3a'], basket: ['#C99A62', '#7a5530'], apple: ['#D9534F', '#7f2420'], lightbulb: ['#F7D96B', '#b8962e'], bubble: ['#F7F2EA', '#8a8176'], bench: ['#8A5A3C', '#5E3B26'],
    door: ['#8A5A3C', '#4a2f1f'], counter: ['#C2813D', '#7a4a1a'], boxes: ['#C99A62', '#7a5530'], ladder: ['#C99A62', '#7a5530'], pot: ['#7f8c97', '#44505c'], newspaper: ['#F7F2EA', '#8a8176'], trophy: ['#F2B84B', '#c98512'],
    boat: ['#5B7DB1', '#2c4468'], candle: ['#F7F2EA', '#B5667A'], bell: ['#F2B84B', '#c98512'], podium: ['#8A5A3C', '#4a2f1f'], watch: ['#F7F2EA', '#44505c'], pencil: ['#F2B84B', '#7a5412'], backpack: ['#3F7A5A', '#24452f'], note: ['#44505c', '#2a2a2a']
  };
  // FREE: fallback [base, detail] pairs for props/raw SVG items that have no PAL entry or `c` override.
  const FREE = [['#E8D3B0', '#8a6a3a'], ['#BCD7E0', '#5B8FA0'], ['#F2B84B', '#c98512'], ['#E06D53', '#7f3524'], ['#7A9E7E', '#44684a'], ['#B5667A', '#6e2d3e'], ['#C99A62', '#7a5530']];
  /* ---------- C1/C2 props (added for scenes-c1/c2; props receive the item so a few accept options: it.v variant, it.skin) ---------- */
  // SKN: skin colour for props that draw a body part (statues, plaques...); item.skin key a-f, default 'd'.
  // The Object.assign(P, {...}) below registers the extra props: they are added in place, and many take the item
  // (it.w / it.h width/height, it.v variant) so one painter can cover several sizes or states.
  const SKN = it => SKIN[(it && it.skin) || 'd'];
  Object.assign(P, {
    coolbox: () => `<rect x="-26" y="-40" width="52" height="40" rx="4"/><rect x="-28" y="-48" width="56" height="10" rx="3" fill="#E4DCCF"/><path d="M-10,-56 H10" fill="none" stroke="#8a8176" stroke-width="4"/><path d="M-10,-56 V-48 M10,-56 V-48" fill="none"/><path d="M-4,-31 H4 V-25 H10 V-17 H4 V-11 H-4 V-17 H-10 V-25 H-4Z" fill="#D8352A"/>`,
    watertaxi: () => `<path d="M-74,-30 H66 Q74,-30 70,-20 L60,0 H-62 Q-72,-14 -74,-30Z"/><path d="M-74,-30 H66" fill="none"/><rect x="-74" y="-22" width="134" height="5" fill="#F7F2EA"/><path d="M-40,-30 V-74 M30,-30 V-74" fill="none" stroke="#8a8176" stroke-width="3"/><path d="M-50,-74 H40 L36,-84 H-46Z" fill="#E8A23B"/><rect x="-86" y="-46" width="14" height="22" rx="3" fill="#2b3138"/><path d="M-80,-24 V-2" fill="none" stroke="#2b3138" stroke-width="3"/>`,
    water: it => { const w = (it && it.w) || 400, h = (it && it.h) || 34; let d = `M${-w / 2},${-h}`; for (let x = -w / 2; x < w / 2; x += 40) d += ` q10,-5 20,0 q10,5 20,0`; return `<path d="${d} V0 H${-w / 2}Z"/><path d="M${-w / 2 + 30},${-h + 12} h26 M${-w / 2 + 120},${-h + 20} h34 M${-w / 2 + 230},${-h + 10} h22 M${-w / 2 + 320},${-h + 22} h30" fill="none"/>`; },
    dock: () => `<rect x="-90" y="-16" width="180" height="10" rx="2"/><path d="M-70,-6 V0 M-20,-6 V0 M30,-6 V0 M76,-6 V0" fill="none" stroke="#5E3B26" stroke-width="7"/><path d="M-60,-16 V-6 M-30,-16 V-6 M0,-16 V-6 M30,-16 V-6 M60,-16 V-6" fill="none"/><rect x="74" y="-34" width="10" height="20" rx="2" fill="#5E3B26"/>`,
    ferry: () => `<path d="M-120,-22 H112 L96,0 H-108Z"/><rect x="-96" y="-44" width="150" height="22" fill="#F7F2EA"/><rect x="-60" y="-62" width="80" height="18" fill="#F7F2EA"/><path d="M-86,-34 H44 M-50,-54 H10" fill="none" stroke-dasharray="6 6"/><rect x="2" y="-80" width="12" height="18" fill="#D8352A"/>`,
    tablet: () => `<rect x="-14" y="-40" width="28" height="38" rx="4"/><rect x="-11" y="-36" width="22" height="28" rx="1" fill="#BCD7E0"/><path d="M-7,-30 H7 M-7,-24 H5 M-7,-18 H7" fill="none"/>`,
    cheese: () => `<path d="M-24,-22 Q-24,-30 0,-30 Q24,-30 24,-22 V-4 Q24,0 0,0 Q-24,0 -24,-4Z"/><path d="M-24,-22 Q-24,-14 0,-14 Q24,-14 24,-22" fill="none"/><path d="M6,-30 L14,-22 L22,-28Z" fill="#F7F2EA"/><circle cx="-10" cy="-7" r="2" fill="#E4C878"/><circle cx="8" cy="-6" r="1.6" fill="#E4C878"/>`,
    plate: () => `<ellipse cx="0" cy="-4" rx="22" ry="5"/><ellipse cx="0" cy="-5" rx="14" ry="3" fill="#E4DCCF"/>`,
    clothtable: () => `<path d="M-70,-50 H70 L76,-20 H-76Z"/><path d="M-60,-20 V0 M60,-20 V0" fill="none" stroke="#8A5A3C" stroke-width="5"/><path d="M-52,-50 L-56,-20 M-20,-50 L-21,-20 M20,-50 L21,-20 M52,-50 L56,-20" fill="none"/>`,
    terraces: it => { const w = (it && it.w) || 300; return `<path d="M${-w / 2},0 L${-w / 2},-60 Q${-w / 4},-150 ${w / 6},-170 L${w / 2},-180 V0Z"/><path d="M${-w / 2 + 10},-50 Q${-w / 4},-70 0,-62 T${w / 2},-70 M${-w / 2 + 20},-82 Q${-w / 4},-100 10,-95 T${w / 2},-105 M${-w / 3},-112 Q${-w / 8},-128 30,-126 T${w / 2},-140 M${-w / 6},-140 Q0,-152 50,-152 T${w / 2},-165" fill="none"/>`; },
    stonewall: () => `<path d="M-70,0 V-34 Q-70,-40 -64,-40 H64 Q70,-40 70,-34 V0Z"/><path d="M-70,-26 H70 M-70,-12 H70 M-50,-40 V-26 M-14,-40 V-26 M26,-40 V-26 M56,-40 V-26 M-34,-26 V-12 M6,-26 V-12 M44,-26 V-12 M-56,-12 V0 M-18,-12 V0 M22,-12 V0 M58,-12 V0" fill="none"/>`,
    fermentbox: () => `<rect x="-40" y="-36" width="80" height="36"/><path d="M-40,-24 H40 M-40,-12 H40" fill="none"/><path d="M-36,-36 Q-20,-46 0,-42 Q20,-48 36,-36Z" fill="#6b3a1f"/><path d="M-42,-36 Q-30,-56 -10,-48 M42,-36 Q36,-58 14,-50" fill="none" stroke="#4f7a4b" stroke-width="4"/>`,
    cacao: () => `<path d="M0,-44 Q16,-40 16,-22 Q16,-4 0,0 Q-16,-4 -16,-22 Q-16,-40 0,-44Z"/><path d="M0,-44 V0 M-8,-41 Q-11,-22 -8,-2 M8,-41 Q11,-22 8,-2" fill="none"/><path d="M0,-44 V-50" fill="none" stroke="#5a4a2a" stroke-width="3"/>`,
    fire: () => `<path d="M-28,-6 L26,-14 M-26,-14 L28,-6" fill="none" stroke="#5E3B26" stroke-width="7"/><path d="M-16,-12 Q-22,-30 -8,-44 Q-6,-34 0,-30 Q2,-50 12,-58 Q12,-40 20,-30 Q24,-20 16,-12Z"/><path d="M-6,-14 Q-8,-26 0,-32 Q4,-24 8,-20 Q10,-16 6,-14Z" fill="#F2B84B"/><ellipse cx="-30" cy="-4" rx="8" ry="5" fill="#7f8c97"/><ellipse cx="30" cy="-4" rx="8" ry="5" fill="#7f8c97"/>`,
    longdrum: () => `<path d="M-9,-110 H9 L8,0 H-8Z"/><ellipse cx="0" cy="-110" rx="9" ry="3" fill="#E8D3B0"/><path d="M-9,-104 L8,-90 L-8,-76 L8,-62 L-8,-48 L8,-34 L-8,-20 L8,-6 M9,-104 L-8,-90 L8,-76 L-8,-62 L8,-48 L-8,-34 L8,-20 L-8,-6" fill="none"/><path d="M-9,-108 H9 M-8,-3 H8" fill="none" stroke="#4a2f1f" stroke-width="3"/>`,
    church: () => `<rect x="-60" y="-100" width="120" height="100"/><path d="M-66,-100 L0,-140 L66,-100Z" fill="#E8D3B0"/><rect x="-92" y="-150" width="34" height="150"/><path d="M-96,-150 L-75,-178 L-54,-150Z" fill="#E8D3B0"/><path d="M-18,0 V-46 Q0,-64 18,-46 V0Z" fill="#F2B84B"/><rect x="-84" y="-138" width="18" height="22" rx="9" fill="#F2B84B"/><circle cx="0" cy="-104" r="9" fill="#F2B84B"/><rect x="28" y="-80" width="16" height="24" rx="8" fill="#F2B84B"/><rect x="-44" y="-80" width="16" height="24" rx="8" fill="#F2B84B"/><path d="M-75,-178 V-192 M-80,-186 H-70" fill="none"/>`,
    canoe: () => `<path d="M-96,-22 Q-60,-8 0,-8 Q60,-8 100,-24 Q90,0 60,0 H-60 Q-88,0 -96,-22Z"/><path d="M-90,-18 Q0,-2 94,-20" fill="none"/>`,
    mangrove: it => `<path d="M-6,-60 V-130 M6,-60 V-130" fill="none" stroke="#5a4636" stroke-width="10"/><path d="M-4,-70 Q-40,-50 -50,0 M-2,-64 Q-20,-30 -22,0 M4,-66 Q26,-34 24,0 M6,-72 Q46,-50 56,0 M0,-62 Q2,-30 0,0" fill="none" stroke="#5a4636" stroke-width="5"/><path d="M-60,-120 Q-80,-150 -50,-170 Q-36,-200 0,-190 Q36,-204 52,-174 Q84,-160 64,-122 Q30,-104 0,-112 Q-30,-104 -60,-120Z"/>`,
    calliper: () => `<rect x="-26" y="-34" width="52" height="7" rx="1"/><path d="M-26,-27 V-12 L-20,-27 M10,-27 V-12 L16,-27" fill="#8a97a3" stroke="none"/><path d="M-22,-31 h2 M-16,-31 h2 M-10,-31 h2 M-4,-31 h2 M2,-31 h2 M8,-31 h2 M14,-31 h2 M20,-31 h2" fill="none"/>`,
    cockle: () => `<path d="M-12,-2 Q-14,-18 0,-22 Q14,-18 12,-2 Q0,2 -12,-2Z"/><path d="M-6,-1 L-4,-18 M0,0 V-20 M6,-1 L4,-18" fill="none"/>`,
    mixer: () => `<path d="M-60,-30 L-50,-56 H50 L60,-30Z"/><rect x="-62" y="-30" width="124" height="12" rx="2" fill="#2b3138"/><path d="M-36,-34 V-50 M-22,-34 V-50 M-8,-34 V-50 M6,-34 V-50" fill="none"/><rect x="-39" y="-46" width="6" height="5" fill="#F2B84B"/><rect x="-25" y="-40" width="6" height="5" fill="#F2B84B"/><rect x="-11" y="-48" width="6" height="5" fill="#F2B84B"/><rect x="3" y="-42" width="6" height="5" fill="#F2B84B"/><rect x="20" y="-52" width="30" height="14" rx="2" fill="#F7F2EA"/><path d="M26,-41 L35,-49" fill="none"/><circle cx="-48" cy="-42" r="3" fill="#D8352A"/>`,
    reel: () => `<circle cx="0" cy="-26" r="26"/><circle cx="0" cy="-26" r="17" fill="#5a3d2a"/><circle cx="0" cy="-26" r="5" fill="#F7F2EA"/><path d="M0,-50 V-34 M-21,-14 L-7,-22 M21,-14 L7,-22" fill="none" stroke="#F7F2EA" stroke-width="5"/>`,
    garaon: () => `<path d="M-22,-70 H22 Q26,-36 18,0 H-18 Q-26,-36 -22,-70Z"/><ellipse cx="0" cy="-70" rx="22" ry="6" fill="#E8D3B0"/><path d="M-21,-64 L-14,-6 L-6,-64 L2,-6 L10,-64 L17,-6 M-14,-6 H17" fill="none"/><path d="M-22,-62 H22" fill="none" stroke="#7a4a1a" stroke-width="3"/>`,
    tamboril: it => (it && it.v === 'open') ? `<path d="M-26,-6 L-30,-90 Q0,-98 30,-90 L26,-6 Q0,2 -26,-6Z"/><ellipse cx="0" cy="-90" rx="30" ry="8" fill="#3a2a1e"/><path d="M-30,-70 Q0,-62 30,-70 M-28,-40 Q0,-32 28,-40 M-26,-14 Q0,-6 26,-14" fill="none" stroke="#7f8c97" stroke-width="3"/><path d="M-12,-92 h10 M2,-91 h12 M-16,-88 h8 M-4,-87 h14" fill="none" stroke="#F7F2EA" stroke-width="1.6"/>` : `<path d="M-26,-6 L-30,-90 Q0,-98 30,-90 L26,-6 Q0,2 -26,-6Z"/><ellipse cx="0" cy="-90" rx="30" ry="8" fill="#E8D3B0"/><path d="M-30,-70 Q0,-62 30,-70 M-28,-40 Q0,-32 28,-40 M-26,-14 Q0,-6 26,-14" fill="none" stroke="#7f8c97" stroke-width="3"/><path d="M-16,-94 V-6 M0,-96 V-2 M16,-94 V-6" fill="none"/>`,
    bassdrum: () => `<rect x="-20" y="-80" width="40" height="80" rx="4" fill="#C2813D"/><ellipse cx="0" cy="-40" rx="14" ry="40"/><ellipse cx="0" cy="-40" rx="9" ry="34" fill="#F7F2EA"/><path d="M-16,-78 L16,-2 M-16,-2 L16,-78" fill="none"/>`,
    bombo: () => `<circle cx="0" cy="-36" r="36" fill="#C2813D"/><circle cx="0" cy="-36" r="30"/><path d="M-34,-48 L-22,-24 L-10,-48 L2,-24 L14,-48 L26,-24" fill="none"/><circle cx="0" cy="-36" r="30" fill="none"/>`,
    palm: () => `<path d="M-4,0 Q-8,-60 6,-120 L14,-118 Q2,-60 6,0Z" fill="#8A5A3C"/><path d="M10,-120 Q-30,-140 -60,-108 Q-30,-124 10,-116 Q30,-150 70,-128 Q36,-134 12,-114 Q50,-110 66,-80 Q40,-104 10,-112 Q-10,-100 -30,-70 Q-14,-104 8,-118Z"/><circle cx="6" cy="-112" r="5" fill="#8A5A3C"/><circle cx="14" cy="-110" r="5" fill="#8A5A3C"/>`,
    sign: () => `<path d="M-40,0 V-60 M40,0 V-60" fill="none" stroke="#5E3B26" stroke-width="5"/><rect x="-54" y="-92" width="108" height="38" rx="4"/><path d="M-42,-80 H-6 M-42,-68 H10 M14,-80 H42" fill="none" stroke="#F7F2EA" stroke-width="4"/><circle cx="30" cy="-68" r="7" fill="#F2B84B"/>`,
    floathouse: () => `<rect x="-62" y="-108" width="124" height="96"/><path d="M-72,-108 L0,-150 L72,-108Z" fill="#B5384A"/><path d="M-62,-94 H62 M-62,-80 H62 M-62,-66 H62 M-62,-52 H62 M-62,-38 H62 M-62,-24 H62 M-46,-130 H46 M-26,-142 H26" fill="none"/><rect x="-46" y="-96" width="20" height="22" fill="#BCD7E0"/><rect x="26" y="-96" width="20" height="22" fill="#BCD7E0"/><rect x="26" y="-56" width="20" height="22" fill="#BCD7E0"/><rect x="-10" y="-54" width="22" height="42" fill="#8A5A3C"/><rect x="-76" y="-12" width="152" height="5" fill="#8A5A3C"/>${[-60, -30, 0, 30, 60].map(x => `<ellipse cx="${x}" cy="-3" rx="14" ry="8" fill="#5a6570"/>`).join('')}`,
    fishboat: () => `<path d="M-50,-24 H50 Q46,-6 34,0 H-40 Q-50,-10 -50,-24Z"/><rect x="-10" y="-46" width="26" height="22" fill="#F7F2EA"/><rect x="-6" y="-42" width="8" height="8" fill="#BCD7E0"/><path d="M-38,-24 V-56" fill="none" stroke="#5E3B26" stroke-width="3"/><path d="M-50,-18 H50" fill="none"/>`,
    ox: () => `<ellipse cx="0" cy="-48" rx="40" ry="22"/><path d="M-30,-34 V0 M-16,-32 V0 M16,-32 V0 M30,-34 V0" fill="none" stroke="#7a5530" stroke-width="8"/><path d="M34,-62 Q50,-74 62,-62 L66,-40 Q60,-30 50,-34 Z"/><path d="M42,-66 Q36,-80 46,-82 M58,-66 Q66,-78 58,-82" fill="none" stroke="#F7F2EA" stroke-width="3.5"/><circle cx="54" cy="-58" r="2" fill="#2a1d16"/><path d="M-40,-50 Q-50,-36 -46,-22" fill="none" stroke="#7a5530" stroke-width="3"/><rect x="28" y="-74" width="10" height="34" rx="2" fill="#8A5A3C"/>`,
    roundhouse: () => `<rect x="-56" y="-62" width="112" height="62"/><path d="M-70,-58 Q-40,-118 0,-128 Q40,-118 70,-58 Q0,-48 -70,-58Z" fill="#C9A15A"/><path d="M-56,-74 Q0,-66 56,-74 M-38,-96 Q0,-90 38,-96 M-20,-114 Q0,-110 20,-114" fill="none"/><path d="M-16,0 V-40 H16 V0Z" fill="#5E3B26"/>`,
    devilmask: () => `<path d="M-14,-34 Q-30,-56 -26,-74 Q-20,-58 -10,-48Z M14,-34 Q30,-56 26,-74 Q20,-58 10,-48Z" fill="#E8D3B0"/><path d="M-16,-46 Q-18,-10 0,-2 Q18,-10 16,-46 Q0,-54 -16,-46Z"/><path d="M-11,-36 L-4,-32 L-11,-30Z M11,-36 L4,-32 L11,-30Z" fill="#F7F2EA"/><path d="M-8,-16 Q0,-10 8,-16" fill="none" stroke="#F7F2EA" stroke-width="2"/><path d="M-16,-40 Q-22,-26 -18,-14 M16,-40 Q22,-26 18,-14" fill="none" stroke="#D8352A" stroke-width="3"/>`,
    coin: () => `<path d="M-14,-4 Q-18,-16 -12,-26 Q-2,-32 10,-28 Q18,-20 15,-8 Q8,2 -4,0 Q-10,0 -14,-4Z"/><path d="M0,-26 V-4 M-11,-15 H12 M-6,-22 l4,4 M6,-22 l-4,4" fill="none"/>`,
    velvet: () => `<path d="M-40,0 L-34,-14 H34 L40,0Z"/>`,
    scale: () => `<rect x="-30" y="-14" width="60" height="14" rx="3"/><rect x="-22" y="-56" width="44" height="42" rx="2" fill="#DCEAF0"/><path d="M-22,-56 H22 M-22,-56 V-14 M22,-56 V-14" fill="none"/><ellipse cx="0" cy="-18" rx="12" ry="2.5" fill="#8a97a3"/><rect x="-16" y="-10" width="18" height="6" rx="1" fill="#9fe0a0"/>`,
    loupe: () => `<circle cx="0" cy="-26" r="13" fill="#DCEAF0"/><circle cx="0" cy="-26" r="13" fill="none" stroke="#2b3138" stroke-width="4"/><path d="M9,-16 L22,-2" fill="none" stroke="#2b3138" stroke-width="5"/>`,
    archwindow: it => `<path d="M-40,0 V-80 Q-40,-120 0,-120 Q40,-120 40,-80 V0Z" fill="#8a8f96"/><path d="M-32,0 V-80 Q-32,-112 0,-112 Q32,-112 32,-80 V0Z"/>` + ((it && it.v === 'cerro') ? `<path d="M-32,-8 L-6,-56 Q0,-62 6,-56 L32,-12 V0 H-32Z" fill="#B5384A"/><path d="M-16,-30 L-6,-40 M4,-44 L12,-34" fill="none"/>` : (it && it.v === 'bay') ? `<path d="M-32,-30 H32 V0 H-32Z" fill="#5B9BD5"/><path d="M-20,-20 h12 M6,-12 h14" fill="none"/>` : (it && it.v === 'poplars') ? `<path d="M-14,0 V-70 M-14,-50 L-22,-64 M-14,-40 L-6,-58 M-14,-60 L-20,-74 M14,0 V-80 M14,-50 L6,-66 M14,-46 L22,-62 M14,-66 L20,-80" fill="none" stroke="#5a4636" stroke-width="2"/>` : '') + `<path d="M0,-112 V0 M-32,-60 H32" fill="none" stroke="#e4dccf" stroke-width="3"/>`,
    ledger: () => `<path d="M0,-6 Q-34,-18 -66,-8 V-50 Q-34,-60 0,-48 Q34,-60 66,-50 V-8 Q34,-18 0,-6Z" fill="#6b3a1f"/><path d="M0,-10 Q-30,-22 -60,-12 V-50 Q-30,-58 0,-48 Q30,-58 60,-50 V-12 Q30,-22 0,-10Z"/><path d="M-52,-42 Q-30,-48 -8,-42 M-52,-34 Q-30,-40 -8,-34 M-52,-26 Q-30,-32 -8,-26 M-52,-18 Q-30,-24 -8,-18 M8,-42 Q30,-48 52,-42 M8,-34 Q30,-40 52,-34 M8,-26 Q30,-32 52,-26 M8,-18 Q30,-24 52,-18 M-30,-48 V-20 M30,-48 V-20 M0,-48 V-10" fill="none"/>`,
    laptopv: it => { const v = it && it.v; let scr = ''; if (v === 'call') scr = `<path d="M-14,-24 Q-14,-36 0,-36 Q14,-36 14,-24Z" fill="#B5667A"/><circle cx="0" cy="-46" r="9" fill="${SKN(it)}"/><path d="M-10,-50 Q-10,-60 0,-60 Q10,-60 10,-50 Q12,-40 8,-38 Q8,-52 0,-52 Q-8,-52 -8,-38 Q-12,-40 -10,-50Z" fill="#1c1512"/>`; else if (v === 'wave') scr = `<path d="M-30,-45 H-22 L-19,-54 L-15,-36 L-11,-58 L-7,-32 L-3,-50 L1,-40 L5,-56 L9,-36 L13,-48 L17,-42 L21,-50 L25,-45 H30" fill="none" stroke="#2c4468" stroke-width="2"/><path d="M4,-62 V-28" fill="none" stroke="#D8352A" stroke-width="1.6"/>`; else if (v === 'chart') scr = `<rect x="-26" y="-40" width="8" height="12" fill="#5B7DB1"/><rect x="-14" y="-48" width="8" height="20" fill="#5B7DB1"/><rect x="-2" y="-44" width="8" height="16" fill="#5B7DB1"/><rect x="10" y="-56" width="8" height="28" fill="#D8352A"/>`; return `<rect x="-42" y="-72" width="84" height="54" rx="4"/><rect x="-36" y="-66" width="72" height="42" rx="2" fill="#DCEAF0"/>${scr}<path d="M-54,-14 H54 L46,-4 H-46Z" fill="#8a97a3"/>`; },
    schoonerpic: () => `<rect x="-36" y="-64" width="72" height="56" rx="2"/><circle cx="0" cy="-60" r="3" fill="#D8352A"/><path d="M-24,-22 H24 L18,-14 H-18Z M-10,-22 V-54 M8,-22 V-50 M-10,-52 L-24,-24 M-8,-52 L4,-24 M10,-48 L22,-24 M8,-48 L-2,-26" fill="none"/><path d="M-30,-12 q6,-3 12,0 q6,3 12,0 q6,-3 12,0 q6,3 12,0 q6,-3 12,0" fill="none"/>`,
    teapot: () => `<path d="M-20,-4 Q-26,-20 -18,-30 Q0,-38 18,-30 Q26,-20 20,-4 Q0,2 -20,-4Z"/><path d="M18,-24 Q32,-30 34,-40 M-20,-26 Q-32,-24 -30,-12 Q-28,-6 -20,-8" fill="none" stroke="#8a8176" stroke-width="3"/><ellipse cx="0" cy="-32" rx="8" ry="3" fill="#E4DCCF"/><circle cx="0" cy="-37" r="3" fill="#E4DCCF"/><path d="M-14,-18 q4,-4 8,0 q4,4 8,0 q4,-4 8,0" fill="none" stroke="#5B7DB1" stroke-width="1.6"/>`,
    blackcake: () => `<path d="M-30,-26 Q-30,-32 0,-32 Q30,-32 30,-26 V-6 Q30,0 0,0 Q-30,0 -30,-6Z"/><path d="M-30,-26 Q-30,-20 0,-20 Q30,-20 30,-26" fill="none"/><path d="M10,-32 L30,-26 V-6 L10,-12Z" fill="#6b3a1f"/><circle cx="16" cy="-18" r="1.8" fill="#D8352A"/><circle cx="22" cy="-12" r="1.6" fill="#F2B84B"/><circle cx="-16" cy="-12" r="1.8" fill="#D8352A"/><circle cx="-4" cy="-8" r="1.6" fill="#F2B84B"/>`,
    notebook: () => `<path d="M0,-4 Q-24,-12 -46,-6 V-40 Q-24,-46 0,-38 Q24,-46 46,-40 V-6 Q24,-12 0,-4Z"/><path d="M0,-38 V-4" fill="none"/><path d="M-40,-32 q4,-2 8,0 t8,0 t8,0 t6,0 M-40,-24 q4,-2 8,0 t8,0 t8,0 M-40,-16 q4,-2 8,0 t8,0 t10,0" fill="none" stroke="#2c4468" stroke-width="1.3"/><path d="M6,-32 q4,-2 8,0 t8,0 t8,0 t6,0 M6,-24 q4,-2 8,0 t8,0 t8,0 M6,-16 q4,-2 8,0 t8,0 t10,0" fill="none" stroke="#B5384A" stroke-width="1.3"/>`,
    poplar: () => `<path d="M0,0 V-130 M0,-40 L-14,-80 M0,-50 L14,-96 M0,-70 L-10,-112 M0,-80 L10,-120 M-14,-80 L-18,-96 M14,-96 L16,-110" fill="none" stroke="#6b5b4b" stroke-width="3"/>`,
    dragon: () => `<path d="M-26,-10 Q-30,-22 -18,-24 L4,-22 Q14,-34 22,-30 L28,-34 L26,-26 Q30,-20 24,-18 L14,-18 Q12,-10 6,-10 L4,-2 H0 L-2,-10 H-12 L-14,-2 H-18 L-18,-10Z"/><path d="M-10,-24 L-4,-44 L4,-36 L10,-46 L10,-24Z" fill="#B5384A"/><path d="M-26,-12 Q-38,-14 -36,-26 Q-34,-30 -30,-28" fill="none" stroke="#D8352A" stroke-width="3"/>`,
    mirror: () => `<rect x="-50" y="-80" width="100" height="70" rx="4"/><rect x="-42" y="-72" width="84" height="54" fill="#DCEAF0"/>${[-42, -21, 0, 21, 42].map(x => `<circle cx="${x}" cy="-80" r="5" fill="#F7E7A0"/>`).join('')}${[-58, -36].map(y => `<circle cx="-50" cy="${y}" r="5" fill="#F7E7A0"/><circle cx="50" cy="${y}" r="5" fill="#F7E7A0"/>`).join('')}<path d="M-30,-60 l14,-10 M-24,-52 l20,-14" fill="none" stroke="#F7F2EA" stroke-width="2"/>`,
    kazoo: () => `<path d="M-16,-6 L16,-10 V-2 L-16,-2Z"/><circle cx="4" cy="-10" r="3" fill="#F2B84B"/>`,
    confetti: it => { const w = (it && it.w) || 160; const C = ['#D8352A', '#F2B84B', '#5B7DB1', '#3f8a55', '#B5667A']; let s = ''; for (let i = 0; i < 22; i++) { const x = ((i * 53) % w) - w / 2, y = -((i * 37) % 70); s += i % 2 ? `<rect x="${x}" y="${y}" width="4" height="7" fill="${C[i % 5]}" transform="rotate(${(i * 41) % 90} ${x} ${y})"/>` : `<circle cx="${x}" cy="${y}" r="2.4" fill="${C[i % 5]}"/>`; } return s; },
    facade: () => `<rect x="-90" y="-150" width="180" height="150"/><rect x="-96" y="-158" width="192" height="10" fill="#C9A15A"/><path d="M-60,0 V-56 Q-60,-70 -46,-70 Q-32,-70 -32,-56 V0Z" fill="#5E3B26"/><rect x="18" y="-66" width="34" height="44" fill="#4D6A8A"/><rect x="-60" y="-132" width="28" height="40" fill="#4D6A8A"/><rect x="20" y="-132" width="28" height="40" fill="#4D6A8A"/><path d="M-66,-92 H-26 M14,-92 H54 M-66,-92 V-104 M-26,-92 V-104 M14,-92 V-104 M54,-92 V-104 M-66,-104 H-26 M14,-104 H54" fill="none" stroke="#2b3138" stroke-width="2"/>`,
    caldero: () => `<path d="M-40,-46 H40 Q42,-8 28,-2 Q0,4 -28,-2 Q-42,-8 -40,-46Z"/><ellipse cx="0" cy="-46" rx="40" ry="7" fill="#a9b3bc"/><path d="M-40,-40 H-50 M40,-40 H50" fill="none" stroke="#5a6570" stroke-width="4"/><path d="M-14,-58 q-6,-8 0,-16 q6,-8 0,-16 M10,-58 q-6,-8 0,-16 q6,-8 0,-16" fill="none" stroke="#B8AE9F" stroke-width="2.5"/>`,
    lid: () => `<path d="M-26,-4 Q0,-16 26,-4Z"/><path d="M-6,-12 V-16 H6 V-12" fill="none" stroke="#2b3138" stroke-width="3"/>`,
    tray: () => `<rect x="-30" y="-8" width="60" height="8" rx="2"/><ellipse cx="-10" cy="-10" rx="14" ry="4" fill="#F7F2EA"/><ellipse cx="-10" cy="-12" rx="9" ry="3" fill="#E8A23B"/><rect x="10" y="-22" width="10" height="14" rx="2" fill="#F7F2EA"/>`,
    fencewindow: it => `<rect x="-50" y="-100" width="100" height="80" rx="3" fill="#8a97a3"/><rect x="-44" y="-94" width="88" height="68" fill="#DCEAF0"/><path d="M-44,-42 H44 V-26 H-44Z" fill="#7A9E7E"/><path d="M-20,-26 Q-20,-44 -6,-46 Q8,-44 8,-26Z" fill="#5B7DB1"/><circle cx="-6" cy="-54" r="8" fill="${SKN(it)}"/><path d="M-14,-56 Q-14,-64 -6,-64 Q2,-64 2,-56 Q-6,-60 -14,-56Z" fill="#1c1512"/><path d="M20,-26 L26,-46 Q30,-56 36,-46 L42,-26Z" fill="#E06D53"/><circle cx="31" cy="-58" r="5" fill="#F2B84B"/><path d="M-44,-80 L-30,-94 M-44,-66 L-16,-94 M-44,-52 L-2,-94 M-44,-38 L12,-94 M-38,-26 L26,-94 M-24,-26 L40,-94 M-10,-26 L44,-80 M4,-26 L44,-66 M18,-26 L44,-52 M32,-26 L44,-38 M44,-80 L30,-94 M44,-66 L16,-94 M44,-52 L2,-94 M44,-38 L-12,-94 M38,-26 L-26,-94 M24,-26 L-40,-94 M10,-26 L-44,-80 M-4,-26 L-44,-66 M-18,-26 L-44,-52 M-32,-26 L-44,-38" fill="none" stroke="#5a6570" stroke-width="0.9"/><path d="M0,-94 V-26" fill="none" stroke="#e4dccf" stroke-width="3"/>`,
    plans: () => `<rect x="-6" y="-48" width="12" height="48" rx="5"/><ellipse cx="0" cy="-48" rx="6" ry="2.5" fill="#E4DCCF"/><path d="M-6,-30 H6 M-6,-16 H6" fill="none" stroke="#D8352A" stroke-width="2"/>`,
    shelter: it => { const w = (it && it.w) || 300; return `<path d="M${-w / 2 - 10},-150 L${w / 2 + 10},-166 L${w / 2 + 10},-156 L${-w / 2 - 10},-140Z"/><path d="M${-w / 2},-142 V0 M${w / 2},-157 V0 M${-w / 6},-146 V0 M${w / 6},-152 V0" fill="none" stroke="#7f8c97" stroke-width="5"/><path d="M${-w / 2 + 20},-149 L${-w / 2 + 20},-142 M${-w / 4},-152 V-145 M0,-155 V-148 M${w / 4},-159 V-152" fill="none"/>`; },
    adobe: () => `<path d="M-70,0 V-36 H-30 V-50 H20 V-30 H70 V0Z"/><path d="M-70,-14 H70 M-56,-36 V-14 M-10,-50 V-30 M36,-30 V-14" fill="none"/><path d="M-26,0 V-24 H-6 V0Z" fill="#8A5A3C"/>`,
    trench: () => `<path d="M-90,0 V-30 H90 V0Z"/><path d="M-90,-22 Q-40,-18 0,-23 T90,-21 M-90,-12 Q-40,-8 0,-13 T90,-11" fill="none" stroke="#c4a878" stroke-width="2"/>`,
    phonepic: () => `<rect x="-14" y="-52" width="28" height="50" rx="5"/><rect x="-11" y="-47" width="22" height="38" rx="2" fill="#F7F2EA"/><path d="M-7,-38 Q-9,-26 -5,-18 H5 Q9,-26 7,-38 Q0,-42 -7,-38Z" fill="#C2653F"/><path d="M-8,-30 H8" fill="none" stroke="#2a1d16" stroke-width="1.4"/>`,
    phonewave: () => `<rect x="-14" y="-52" width="28" height="50" rx="5"/><rect x="-11" y="-47" width="22" height="38" rx="2" fill="#DCEAF0"/><path d="M-9,-28 h3 l2,-8 l3,14 l3,-18 l3,20 l3,-12 l2,4 h2" fill="none" stroke="#D8352A" stroke-width="1.6"/>`,
    maize: () => `<path d="M0,0 V-110" fill="none" stroke="#4f7a4b" stroke-width="4"/><path d="M0,-30 Q-30,-40 -40,-20 M0,-50 Q30,-60 40,-40 M0,-70 Q-28,-84 -36,-64 M0,-90 Q22,-104 30,-88 M0,-110 L-6,-124 M0,-110 L6,-126" fill="none" stroke="#4f7a4b" stroke-width="5"/><path d="M4,-60 Q14,-74 8,-86 Q-2,-74 4,-60Z" fill="#F2B84B"/>`,
    trowel: () => `<path d="M0,-22 L-8,-4 L0,4 L8,-4Z"/><path d="M0,-22 V-34" fill="none" stroke="#8A5A3C" stroke-width="4"/>`,
    tarima: () => `<path d="M-90,-24 H90 L94,-14 V0 H-94 V-14Z"/><path d="M-94,-14 H94 M-60,-24 V-14 M-20,-24 V-14 M20,-24 V-14 M60,-24 V-14" fill="none"/>`,
    statue: it => `<rect x="-26" y="-60" width="52" height="60"/><rect x="-32" y="-66" width="64" height="8" fill="#a9a29a"/><g fill="#8a6a3a"><rect x="-10" y="-112" width="9" height="46" rx="4"/><rect x="2" y="-112" width="9" height="46" rx="4"/><path d="M-16,-150 Q0,-156 16,-150 L14,-108 H-14Z"/><circle cx="0" cy="-166" r="12"/></g>` + ((it && it.v === 'chains') ? `<path d="M-14,-148 L-30,-184 M14,-148 L30,-184" fill="none" stroke="#8a6a3a" stroke-width="9"/><path d="M-36,-192 h10 M26,-192 h10" fill="none" stroke="#5a6570" stroke-width="3"/>` : `<path d="M-14,-148 L-20,-112 M14,-148 L34,-180" fill="none" stroke="#8a6a3a" stroke-width="9"/><path d="M34,-182 L50,-212" fill="none" stroke="#a9b3bc" stroke-width="4"/>`),
    plaque: it => `<path d="M-24,0 L-4,-80 M24,0 L4,-80 M0,0 V-70" fill="none" stroke="#5E3B26" stroke-width="4"/>` + ((it && it.v === 'open') ? `<rect x="-30" y="-96" width="60" height="44" rx="3"/><path d="M-20,-84 H20 M-20,-74 H20 M-20,-64 H10" fill="none"/>` : `<path d="M-32,-98 Q0,-104 32,-98 L36,-46 Q20,-40 6,-48 Q-10,-40 -36,-46Z" fill="#D8352A"/><path d="M-20,-96 L-24,-46 M2,-100 V-48 M20,-98 L24,-44" fill="none"/>`),
    stringlights: it => { const w = (it && it.w) || 300; let s = `<path d="M${-w / 2},-10 Q${-w / 4},10 0,-6 Q${w / 4},10 ${w / 2},-10" fill="none" stroke="#2b3138" stroke-width="1.5"/>`; for (let i = 1; i < 10; i++) { const x = -w / 2 + i * w / 10; s += `<circle cx="${x}" cy="${(Math.abs(Math.sin(i * Math.PI / 5)) * 10 - 4).toFixed(1)}" r="4.5" fill="#F7E07A"/>`; } return s; },
    judgebench: () => `<rect x="-80" y="-70" width="160" height="70"/><rect x="-86" y="-78" width="172" height="10" fill="#5E3B26"/><path d="M-60,-56 V-14 H-20 V-56Z M20,-56 V-14 H60 V-56Z" fill="none"/>`,
    pyflag: () => `<path d="M0,0 V-120" fill="none" stroke="#8a6a3a" stroke-width="3"/><rect x="0" y="-118" width="54" height="11" fill="#D8352A"/><rect x="0" y="-107" width="54" height="11" fill="#F7F2EA"/><rect x="0" y="-96" width="54" height="11" fill="#2c4fa0"/><circle cx="27" cy="-101.5" r="3.5" fill="#3f8a55"/>`,
    board: () => `<rect x="-44" y="-70" width="88" height="62" rx="3"/><rect x="-36" y="-62" width="40" height="30" fill="#2b2b2b"/><path d="M-36,-40 Q-26,-46 -16,-38 T4,-42 V-32 H-36Z" fill="#E8A23B"/><path d="M-30,-58 V-44 M-22,-60 V-46 M-12,-56 V-44" fill="none" stroke="#5a5248" stroke-width="2"/><rect x="12" y="-60" width="24" height="18" fill="#F7F2EA"/><path d="M15,-54 H33 M15,-48 H28" fill="none"/><path d="M-30,-8 V0 M30,-8 V0" fill="none" stroke="#5E3B26" stroke-width="4"/><circle cx="-16" cy="-62" r="2.5" fill="#D8352A"/><circle cx="24" cy="-60" r="2.5" fill="#D8352A"/>`,
    fan: () => `<path d="M0,-40 V-20" fill="none" stroke="#5a6570" stroke-width="3"/><ellipse cx="-24" cy="-14" rx="22" ry="4"/><ellipse cx="24" cy="-14" rx="22" ry="4"/><circle cx="0" cy="-16" r="6" fill="#5a6570"/>`,
    recorder: () => `<rect x="-7" y="-36" width="14" height="36" rx="3"/><rect x="-5" y="-30" width="10" height="10" fill="#9fe0a0"/><circle cx="0" cy="-10" r="3" fill="#D8352A"/><rect x="-4" y="-44" width="8" height="8" rx="2" fill="#2b3138"/>`,
    whitewall: it => { const w = (it && it.w) || 300, h = (it && it.h) || 110; return `<rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}"/><path d="M${-w / 2 - 6},${-h} H${w / 2 + 6} L${w / 2},${-h - 12} H${-w / 2}Z" fill="#B5384A"/><path d="M${-w / 2},-18 H${w / 2}" fill="none"/>`; },
    cassette: () => `<rect x="-42" y="-34" width="84" height="34" rx="4"/><rect x="-36" y="-28" width="44" height="20" rx="2" fill="#2b3138"/><circle cx="-24" cy="-18" r="4.5" fill="#F7F2EA"/><circle cx="-4" cy="-18" r="4.5" fill="#F7F2EA"/><circle cx="26" cy="-18" r="9" fill="#5a6570"/><path d="M-36,-38 H-20 M-14,-38 H2 M8,-38 H16" fill="none" stroke="#2b3138" stroke-width="3"/><path d="M-34,-34 L-40,-60" fill="none" stroke="#8a97a3" stroke-width="2"/>`,
    tapebox: () => `<path d="M-38,0 V-34 H38 V0Z"/><path d="M-38,-34 L-48,-46 M38,-34 L46,-48" fill="none" stroke="#9C6A33" stroke-width="4"/>${[-28, -12, 4, 20].map((x, i) => `<rect x="${x}" y="-44" width="12" height="16" rx="1" fill="${['#2b3138', '#D8352A', '#F7F2EA', '#5B7DB1'][i]}"/>`).join('')}`,
    photo: () => `<rect x="-22" y="-30" width="44" height="30" rx="1" fill="#F7F2EA"/><rect x="-18" y="-26" width="36" height="22" fill="#C9A87A"/><path d="M-18,-10 H18" fill="none"/><circle cx="-10" cy="-17" r="3" fill="#6b4a2e"/><circle cx="-2" cy="-16" r="3" fill="#6b4a2e"/><circle cx="6" cy="-17" r="3" fill="#6b4a2e"/><circle cx="13" cy="-16" r="2.6" fill="#6b4a2e"/>`,
    teaglass: () => `<path d="M-10,-30 H10 L8,-4 H-8Z" fill="#DCEAF0"/><path d="M-10,-14 H10 L9,0 H-9Z" fill="#c98512"/><path d="M10,-24 Q18,-22 16,-12 Q14,-8 9,-8" fill="none" stroke="#c98512" stroke-width="2.5"/><path d="M-6,-24 h12" fill="none" stroke="#B8622E" stroke-width="1"/>`,
    cotton: () => `<path d="M0,0 V-40 M0,-20 L-14,-32 M0,-26 L12,-38" fill="none" stroke="#5a4a2a" stroke-width="3"/><path d="M-30,-30 Q-34,-58 -10,-56 Q0,-72 14,-58 Q34,-58 30,-32 Q0,-20 -30,-30Z" fill="#4f9a4a"/><circle cx="-16" cy="-48" r="6"/><circle cx="2" cy="-58" r="6.5"/><circle cx="18" cy="-46" r="6"/><circle cx="-4" cy="-38" r="5.5"/>`,
    hacienda: it => { const w = (it && it.w) || 260; let a = ''; for (let x = -w / 2 + 20; x < w / 2 - 10; x += 34) a += `<path d="M${x},0 V-30 Q${x + 12},-46 ${x + 24},-30 V0Z" fill="#7a5530"/>`; return `<rect x="${-w / 2}" y="-60" width="${w}" height="60"/><path d="M${-w / 2 - 8},-60 H${w / 2 + 8} L${w / 2},-74 H${-w / 2}Z" fill="#B5603A"/>${a}`; },
    cajon: () => `<rect x="-20" y="-44" width="40" height="44" rx="2"/><circle cx="0" cy="-26" r="7" fill="#3a2a1e"/>`
  });
  // [base, detail] colours for the C1/C2 props above (merged into PAL).
  Object.assign(PAL, {
    coolbox: ['#F7F2EA', '#8a8176'], watertaxi: ['#3a6ea5', '#1f3b5c'], water: ['#5BA7B5', '#2f6a74'], dock: ['#9a6b45', '#5E3B26'], ferry: ['#9fb1bf', '#5a6570'], tablet: ['#44505c', '#1f2730'],
    cheese: ['#F2D98B', '#b8962e'], plate: ['#F7F2EA', '#8a8176'], clothtable: ['#F7F2EA', '#B8AE9F'], terraces: ['#9CC48F', '#44684a'], stonewall: ['#B8AE9F', '#6b6359'], fermentbox: ['#9a6b45', '#5E3B26'],
    cacao: ['#C2653F', '#6b2f1a'], fire: ['#E06D53', '#7f3524'], longdrum: ['#8A5A3C', '#4a2f1f'], church: ['#F7F2EA', '#8a8176'], canoe: ['#7a5530', '#3f2a18'], mangrove: ['#4f7a4b', '#2c4a2a'], calliper: ['#a9b3bc', '#44505c'],
    cockle: ['#3a3430', '#8a8176'], mixer: ['#5a6570', '#2b3138'], reel: ['#a9b3bc', '#44505c'], garaon: ['#9a6b45', '#4a2f1f'], tamboril: ['#3f8a55', '#24452f'], bassdrum: ['#F7F2EA', '#8a8176'], bombo: ['#F7F2EA', '#7a4a1a'],
    palm: ['#4f8a4b', '#2c4a2a'], sign: ['#D8352A', '#7f2420'], floathouse: ['#E8B84B', '#8a6a1a'], fishboat: ['#3a6ea5', '#1f3b5c'], ox: ['#8a5a3a', '#4a2f1f'], roundhouse: ['#D9B98A', '#8a6a3a'], devilmask: ['#2b2b2b', '#D8352A'],
    coin: ['#cfd3d6', '#6a7178'], velvet: ['#2b2b2b', '#111111'], scale: ['#5a6570', '#2b3138'], loupe: ['#DCEAF0', '#2b3138'], archwindow: ['#7fb2d9', '#4a6a92'], ledger: ['#EFE3C8', '#8a6a3a'], laptopv: ['#B8C2CC', '#4a5560'],
    schoonerpic: ["#EFE3C8", "#6b5b4b"], teapot: ['#F7F2EA', '#8a8176'], blackcake: ['#4a2a1a', '#2a1810'], notebook: ['#EFE3C8', '#8a6a3a'], poplar: ['#6b5b4b', '#6b5b4b'], dragon: ['#D8352A', '#7f2420'],
    mirror: ['#2b2b2b', '#111111'], kazoo: ['#F2B84B', '#7a5412'], confetti: ['#F2B84B', '#c98512'], facade: ['#E8D3B0', '#8a6a3a'], caldero: ['#9aa6b0', '#44505c'], lid: ['#a9b3bc', '#44505c'], tray: ['#E8A23B', '#7a5412'],
    fencewindow: ['#DCEAF0', '#5a6570'], plans: ['#DCEAF0', '#4a6a92'], shelter: ['#a9b3bc', '#5a6570'], adobe: ['#C9A07A', '#7a5530'], trench: ['#d9c29a', '#8a6a3a'], phonepic: ['#44505c', '#1f2730'], phonewave: ['#44505c', '#1f2730'],
    maize: ['#4f7a4b', '#2c4a2a'], trowel: ['#a9b3bc', '#44505c'], tarima: ['#9a6b45', '#5E3B26'], statue: ['#a9a29a', '#5a5248'], plaque: ['#C9963A', '#6b4a1a'], stringlights: ['#F7E07A', '#8a7a2a'], judgebench: ['#7a4a2a', '#3f2516'],
    pyflag: ['#D8352A', '#7f2420'], board: ['#C99A62', '#7a5530'], fan: ['#7f8c97', '#44505c'], recorder: ['#44505c', '#1f2730'], whitewall: ['#F7F2EA', '#B8AE9F'], cassette: ['#7f8c97', '#2b3138'], tapebox: ['#C99A62', '#7a5530'],
    photo: ['#F7F2EA', '#6b5b4b'], teaglass: ['#c9a227', '#7a5412'], cotton: ['#F7F2EA', '#8a8176'], hacienda: ['#D9B98A', '#8a6a3a'], cajon: ['#8A5A3C', '#4a2f1f']
  });
  /* make raw/legacy outline markup flat: unfilled paths become fine detail lines, dark fills soften, white fills go cream */
  // flat(str, base, det): wrap prop/raw-SVG markup in <g fill=base> and rewrite its legacy outline styling:
  //  1) fill="none" (optionally followed by a stroke-width) that has no stroke after it -> a `det`-coloured 1.8px round line;
  //     the (?! stroke=) lookahead leaves shapes that already define their own stroke untouched.
  //  2) a bare <path d="..." /> (no attributes, note the space before "/>") -> the same detail line instead of a filled shape.
  //  3) fill="#1d1d1d" (the old INK outline colour) -> det; fill="#fff" -> cream LT.
  function flat(str, base, det) {
    return `<g fill="${base}" stroke="none">` + str
      .replace(/fill="none"(?! stroke=)( stroke-width="[\d.]+")?/g, `fill="none" stroke="${det}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"`)
      .replace(/<path d="([^"]*)" \/>/g, `<path d="$1" fill="none" stroke="${det}" stroke-width="1.8" stroke-linecap="round"/>`)
      .replace(/fill="#1d1d1d"/g, `fill="${det}"`).replace(/fill="#fff"/g, `fill="${LT}"`) + '</g>';
  }

  /* ---------- scene ---------- */
  // item(it, k): render one scene item (k = its index, used to vary FREE colours for raw SVG items).
  // The wrapper transform is translate(x,y) scale(+-s, s) rotate(r); y defaults to 250 (ground). Unknown prop names render empty.
  // t:'svg' items with 4+ <circle>s and no `c` get a fixed purple pair instead of a FREE one.
  // t:'line' returns directly: it ignores the transform and uses absolute scene coordinates.
  function item(it, k) {
    const s = it.s || 1, sx = it.flip ? -s : s, r = it.r ? ` rotate(${it.r})` : '';
    const tr = `translate(${n(it.x || 0)},${n(it.y == null ? 250 : it.y)}) scale(${n(sx)},${n(s)})${r}`;
    let inner = '';
    if (it.t === 'person') inner = person(it);
    else if (it.t === 'obj') { const pal = it.c || PAL[it.n] || FREE[hash(it.n) % FREE.length]; inner = flat((P[it.n] || (() => ''))(it), pal[0], pal[1]); }
    else if (it.t === 'svg') { const pal = it.c || (((it.svg.match(/<circle/g) || []).length >= 4) ? ['#8C6BB1', '#4f3a78'] : FREE[(hash(it.svg) + k) % FREE.length]); inner = flat(it.svg, pal[0], pal[1]); }
    else if (it.t === 'line') return `<path d="M${it.x1},${it.y1} L${it.x2},${it.y2}" fill="none" stroke="#8a8176" stroke-width="${it.w ? Math.min(it.w, 4) : 2}" stroke-linecap="round"/>`;
    return `<g transform="${tr}">${inner}</g>`;
  }
  // WALLS: [wall, floor] background pairs for the flat style; one is chosen by hash of the whole spec (stable per scene).
  const WALLS = [['#F1E8DB', '#E4D5BF'], ['#E6EEF2', '#D3E0E8'], ['#EEF0E2', '#DCE3C6'], ['#F5E6E0', '#EBD0C6'], ['#ECE8F3', '#DAD3E8'], ['#F3EBD6', '#E6D8B3']];
  // sceneFlat(spec): the "flat" mode: pastel wall + ground band behind the items, no halftone/ink processing.
  // Items are painted with their real flat colours. Ground band starts at gy-2 (default gy 252) and runs to the bottom.
  function sceneFlat(spec) {
    const items = (spec.items || spec).map(item).join('');
    const w = WALLS[hash(JSON.stringify(spec)) % WALLS.length], gy = spec.gy == null ? 252 : spec.gy;
    const bg = spec.bg === false ? '' : `<rect width="400" height="300" fill="${w[0]}"/>`;
    const ground = spec.ground === false ? '' : `<rect y="${gy - 2}" width="400" height="${302 - gy}" fill="${w[1]}"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${spec.vb ? spec.vb.join(' ') : '0 0 400 300'}" width="400" height="300">${bg}${ground}${items}</svg>`;
  }
  // lumH: perceived luminance 0..1 of a hex colour (weights .3/.59/.11); also expands 3-digit hex. Drives the tone classes below.
  const lumH = h => { if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; return (.3 * parseInt(h.slice(1, 3), 16) + .59 * parseInt(h.slice(3, 5), 16) + .11 * parseInt(h.slice(5, 7), 16)) / 255; };
  /* Duotone screenprint: two inks on cream paper. Dark tones = ink A, mid tones = ink B (slightly off-register),
     light-mid tones = halftone dots in A, fine ink line on top. opts.simple = solid fills only (for PDF rendering);
     opts.fx = hand-drawn wobble + paper grain (inline pictures). */
  // scene(spec, opts) -> SVG string. Strategy: render the items once in flat colours (like sceneFlat), then re-map every
  // fill/stroke hex colour by luminance into the print palette via rep()/cls():
  //   dark (<.3) -> ink A solid; mid (<.58) -> ink B (printed again offset by 2,1.5 with multiply = "off-register");
  //   light-mid (<.82) -> halftone dot pattern in A; lightest -> bare paper. Then `lines` re-draws the items as thin ink-A outlines.
  // rep() only matches fill="#rgb[rrggbb]" / stroke="#..." attributes, so colours must be hex literals in item markup.
  // Pattern/filter ids embed hash(spec) so several scenes inlined in one page do not clash.
  function scene(spec, opts) {
    opts = opts || {};
    if (opts.flat) return sceneFlat(spec);
    const ink = spec.ink || ['#1f3b73', '#e8765c'], A = ink[0], B = ink[1], PAPER = '#f3ead6';
    const items = (spec.items || spec).map(item).join('');
    const id = hash(JSON.stringify(spec)).toString(36);
    const rep = fn => items.replace(/(fill|stroke)="(#[0-9a-fA-F]{3,6})"/g, (m, a, h) => `${a}="${fn(h)}"`);
    const tint = mix(A, 255, .62);
    const skinBase = new Set(Object.values(SKIN).map(x => x.toLowerCase()));
    const skinShade = new Set([]); Object.values(SKIN).forEach(x => [.08, .12, .15, .3].forEach(k => skinShade.add(darken(x, k).toLowerCase())));
    /* darker skins (lum < .62) print as ONE even halftone of the second ink over the whole face/hands/neck/ears
       (denser for darker tones) instead of a solid block on one half and dots on the other */
    const skinDark = {}; Object.values(SKIN).forEach(x => { const l = lumH(x); if (l >= .62) return; const lv = l > .42 ? 1 : l > .28 ? 2 : 3; [0, .08, .12, .15].forEach(k => { skinDark[darken(x, k).toLowerCase()] = lv; }); });
    // cls(hex): tone class for a colour: 'dark' | 'mid' | 'dots' | 'none', or 'skin1..3' for dark skin tones (see above).
    // Light skin stays bare paper; shaded skin halves become halftone so faces keep a subtle shadow.
    const cls = h => {
      h = h.toLowerCase(); const l = lumH(h);
      if (skinDark[h]) return 'skin' + skinDark[h];
      if (skinBase.has(h)) return l < .62 ? 'mid' : 'none';          /* faces and hands: bare paper when light */
      if (skinShade.has(h)) return l < .3 ? 'dark' : 'dots';            /* shaded side of skin: halftone (dark detail lines of dark skin: ink A) */
      return l < .3 ? 'dark' : l < .58 ? 'mid' : l < .82 ? 'dots' : 'none';
    };
    // dotFill: the halftone fill for 'dots' regions: a pattern url normally, a flat light tint in simple mode (no <defs> emitted).
    const dotFill = opts.simple ? tint : `url(#d${id})`;
    /* multi-ink (spec.inks = [A, B, C, D...]): same halftone look, but each colour family prints in its own ink
       (spec.dots1: also define the halftone pattern for ink B, which colours near B's hue reference; off by default to keep older scenes byte-identical) */
    const inks = spec.inks && spec.inks.length > 2 ? spec.inks : null;
    const hslOf = h => { if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; const r = parseInt(h.slice(1, 3), 16) / 255, g = parseInt(h.slice(3, 5), 16) / 255, b = parseInt(h.slice(5, 7), 16) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let hh = 0; if (d) hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh = (hh * 60 + 360) % 360; const l = (mx + mn) / 2; return { h: hh, s: d ? d / (1 - Math.abs(2 * l - 1)) : 0, l }; };
    const inkHSL = inks ? inks.map(hslOf) : [], inkSat = h => hslOf(h).s;
    const inkOf = h => { const x = hslOf(h); if (x.s < .2) return 0; let best = 0, bd = 1e9; for (let k = 2; k < inks.length; k++) { let dh = Math.abs(x.h - inkHSL[k].h); if (dh > 180) dh = 360 - dh; if (dh < bd) { bd = dh; best = k; } } let dh1 = Math.abs(x.h - inkHSL[1].h); if (dh1 > 180) dh1 = 360 - dh1; return (inks.length > 2 && dh1 + 12 < bd) ? 1 : best; };
    // Multi-ink helpers (only used when `inks` is set): hslOf = hex -> {h,s,l}; inkOf = pick the extra ink (index >= 2) whose
    // hue is nearest the colour (ink B wins only if clearly closer; unsaturated colours, s<.2, use ink A). SK_R/SK_T = dot radius /
    // simple-mode tint for the three dark-skin halftone levels; skinFill/dotsIn/multiFill map a colour to its final fill.
    const SK_R = [0, 1.35, 1.7, 2.05], SK_T = [0, .55, .38, .2];
    const skinFill = c => { const lv = +c.slice(4), SI = inks ? inks[1] : B; return opts.simple ? mix(SI, 255, SK_T[lv]) : `url(#s${id}_${lv})`; };
    const dotsIn = k => opts.simple ? mix(inks[k], 255, .62) : (k === 0 ? dotFill : `url(#d${id}_${k})`);
    const multiFill = h => { const c = cls(h), lo = h.toLowerCase(); if (c.startsWith('skin')) return skinFill(c); if (skinBase.has(lo)) return c === 'mid' ? B : PAPER; if (c === 'none') return PAPER; const k = inkOf(h); return c === 'dark' ? (inkSat(h) > .35 && k > 0 ? darken(inks[k], .3) : A) : c === 'mid' ? (k === 0 ? A : inks[k]) : dotsIn(k); };
    // Three recoloured copies of the items: `single` = the main print layer (dark/dots/paper, or multi-ink), `mid` = only the
    // ink-B regions (everything else 'none'), `dots` = only halftone regions. (`dark` is an unused empty string; `dots` is not
    // referenced in the final SVG below.)
    const single = rep(h => { if (inks) return multiFill(h); const c = cls(h); if (c.startsWith('skin')) return skinFill(c); return c === 'dark' ? A : c === 'mid' ? B : c === 'dots' ? dotFill : PAPER; });
    const dark = '';
    const mid = rep(h => inks ? (cls(h) === 'mid' && skinBase.has(h.toLowerCase()) ? B : 'none') : (cls(h) === 'mid' ? B : 'none'));
    const dots = rep(h => cls(h) === 'dots' ? dotFill : 'none');
    const v = spec.vb || [0, 0, 400, 300], gy = spec.gy == null ? 252 : spec.gy;
    const bg = spec.bg === false ? '' : `<rect x="0" y="0" width="400" height="300" fill="${PAPER}"/>`;
    const ground = spec.ground === false ? '' : `<path d="M0,${gy} H400" stroke="${A}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    let defs = '', lines = '', grain = '';
    if (!opts.simple) {
      const SI = inks ? inks[1] : B;
      defs = `<defs>` + [1, 2, 3].map(lv => `<pattern id="s${id}_${lv}" width="4.5" height="4.5" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="2.2" cy="2.2" r="${SK_R[lv]}" fill="${SI}"/></pattern>`).join('') + `<pattern id="d${id}" width="4.5" height="4.5" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="2.2" cy="2.2" r="1.25" fill="${A}"/></pattern>` + (inks ? inks.map((c, k) => (k === 0 || (k === 1 && !spec.dots1)) ? '' : `<pattern id="d${id}_${k}" width="4.5" height="4.5" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><circle cx="2.2" cy="2.2" r="1.25" fill="${c}"/></pattern>`).join('') : '') +
        (opts.fx ? `<filter id="w${id}" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.5"/></filter><filter id="g${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="2" result="n"/><feColorMatrix in="n" type="saturate" values="0"/></filter>` : '') +
        `</defs><style>.dl${id} *{fill:none;stroke:${A};stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}</style>`;
      lines = `<g class="dl${id}"${opts.fx ? ` filter="url(#w${id})"` : ''}>${items}</g>`;
      if (opts.fx) grain = `<rect x="${v[0]}" y="${v[1]}" width="${v[2]}" height="${v[3]}" filter="url(#g${id})" opacity=".2" style="mix-blend-mode:multiply"/>`;
    }
    const midG = opts.simple ? '' : `<g transform="translate(2,1.5)" style="mix-blend-mode:multiply">${mid}</g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${spec.vb ? spec.vb.join(' ') : '0 0 400 300'}" width="400" height="300">${defs}${bg}${ground}${midG}<g>${single}</g>${lines}${grain}</svg>`;
  }
  // Public API: CommonJS export under Node, window.Art in the browser. props/skins list the available prop and skin names
  // (handy for validating scene JSON).
  const api = { scene, sceneFlat, props: Object.keys(P), skins: Object.keys(SKIN) };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Art = api;
})(typeof window !== 'undefined' ? window : this);
