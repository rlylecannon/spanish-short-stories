/* ===== AI layer: one entry point for every "ask an AI" feature. =====
   Inside Claude: uses claude.use('sample'). Elsewhere: POSTs {prompt, tier} to DATA.cfg.aiEndpoint and reads {text}.
   With neither, AI.on() is false and every feature falls back to its offline version.
   Public API: const AI = { on(), ask(prompt), json(text), onReady(fn) }.
     on()        -> boolean, true when a Claude sample function or DATA.cfg.aiEndpoint is available.
     ask(prompt) -> Promise<string> (reply text). Rejects with an Error; .code is 'rate_limited' (HTTP 429) or
                    'unavailable' (no backend). 'timeout' (no reply within 25 s). Other failures are plain Errors ('http NNN', network);
                    errors thrown by the Claude runtime itself pass through unchanged.
     json(text)  -> tolerant extraction of the first {...} JSON object from a model reply; throws Error('no json').
     onReady(fn) -> calls fn once AI becomes available (async in the Claude runtime); returns an unsubscribe function
                    (callers push it onto app.js `teardown`). Used by speak.js, warmup.js and app.js (writing feedback).
   Depends on: DATA.cfg.aiEndpoint (optional string; see docs/AI-BACKEND.md), window.claude.use('sample') (optional).
   Endpoint contract: POST JSON {prompt, tier:'quick'} -> JSON {text}. No localStorage use. ===== */
const AI = (() => {
  // sample: Claude-runtime sampling function once granted (null until then); subs: onReady callbacks.
  let sample = null; const subs = [];
  // Configured endpoint URL, or '' when none (read lazily so DATA.cfg may be absent).
  const ep = () => (DATA.cfg && DATA.cfg.aiEndpoint) || '';
  const on = () => !!sample || !!ep();
  // Notify subscribers; one failing callback must not stop the others.
  const fire = () => subs.forEach(f => { try { f(); } catch (e) {} });
  // Inside Claude the sample capability arrives asynchronously (if unavailable, sample stays null); notify when it does.
  try { if (window.claude && claude.use) claude.use('sample').then(f => { if (f) { sample = f; fire(); } }).catch(() => {}); } catch (e) {}
  // An endpoint is available immediately; fire on the next tick so subscribers registered during startup still run.
  if (ep()) setTimeout(fire, 0);
  // Send one prompt, preferring the Claude runtime, then the HTTP endpoint; returns reply text (see header for error codes).
  async function ask(prompt) {
    if (sample) { const r = await sample([{ role: 'user', content: prompt }], { cache: false, modelTier: 'quick' }); return String(r.text || ''); }
    if (ep()) {
      // AbortController gives the fetch a 25 s timeout so a hung backend cannot freeze the UI; the timer is cleared in `finally` after the body has been read; a timeout rejects with .code 'timeout'.
      // Where AbortController is missing, no timeout is applied.
      const ctl = typeof AbortController === 'function' ? new AbortController() : null, tm = ctl ? setTimeout(() => ctl.abort(), 25000) : 0;
      try {
        const r = await fetch(ep(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, tier: 'quick' }), signal: ctl ? ctl.signal : undefined });
        if (r.status === 429) { const e = new Error('rate'); e.code = 'rate_limited'; throw e; }
        if (!r.ok) throw new Error('http ' + r.status);
        const j = await r.json(); return String(j.text || ''); // the abort timer also covers reading the body
      } catch (e) { if (e && e.name === 'AbortError') { const t = new Error('timeout'); t.code = 'timeout'; throw t; } throw e; } finally { clearTimeout(tm); }
    }
    const e = new Error('no AI'); e.code = 'unavailable'; throw e;
  }
  // Pull a JSON object out of chatty model output: parse from the first '{' to the last '}'; if that fails (trailing prose
  // containing '}'), retry with progressively earlier '}' positions until something parses.
  const json = t => { const s = String(t), a = s.indexOf('{'); if (a < 0) throw new Error('no json'); try { return JSON.parse(s.slice(a, s.lastIndexOf('}') + 1)); } catch (e) { for (let b = s.lastIndexOf('}'); b > a; b = s.lastIndexOf('}', b - 1)) { try { return JSON.parse(s.slice(a, b + 1)); } catch (e2) {} } throw new Error('no json'); } };
  // Subscribe to availability; fires on the next tick if AI is already on. Returns an unsubscribe function.
  const onReady = f => { subs.push(f); if (on()) setTimeout(f, 0); return () => { const i = subs.indexOf(f); if (i >= 0) subs.splice(i, 1); }; };
  return { on, ask, json, onReady };
})();
