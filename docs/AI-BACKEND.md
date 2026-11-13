# Running the site outside Claude

The page is one static file (`index.html`, built by `python3 tools/build_site.py <out-dir>`). Host it anywhere.

## What works with no backend
Stories, dictionary, grammar cards, quizzes, flashcards, placement, progress, notebook (localStorage), PDFs, device read-aloud and speech matching (Chrome/Safari/Edge), scripted role-plays, "Check my writing".

## What needs a backend (hidden automatically when missing)
Open role-play with goals, detailed writing feedback, spoken-retell feedback. All go through one function, `AI.ask(prompt)` in `site-src/ai.js`.

## Turn it on
Create `site-config.json` next to `tools/` before building:

    { "aiEndpoint": "https://your-worker.example.workers.dev/ai",
      "audioBase": "https://cdn.example.com/spanish-audio" }

* `aiEndpoint` receives `POST {"prompt": "...", "tier": "quick"}` and must return `{"text": "..."}`. HTTP 429 shows a "wait a moment" message.
* `audioBase` (optional): MP3 per story line at `<audioBase>/<story-id>/<line-index>.mp3` (e.g. `a1-02/0.mp3`). Missing files fall back to device voices.
* Sync/accounts (`claude.use('user'/'db')`) are Claude-only; elsewhere progress stays on the device. Add your own backend (Firebase/Supabase) in `site-src/progress.js` `syncInit` if you want accounts.

## Minimal Cloudflare Worker (API key stays secret)
    export default {
      async fetch(req, env) {
        const cors = { 'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN, 'Access-Control-Allow-Headers': 'Content-Type' };
        if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
        if (req.method !== 'POST') return new Response('no', { status: 405, headers: cors });
        const ip = req.headers.get('CF-Connecting-IP') || 'x';
        const { success } = await env.LIMITER.limit({ key: ip });   // Workers rate-limit binding, e.g. 20/min
        if (!success) return new Response('slow down', { status: 429, headers: cors });
        const { prompt } = await req.json();
        if (!prompt || prompt.length > 6000) return new Response('bad', { status: 400, headers: cors });
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
          body: JSON.stringify({ model: env.MODEL, max_tokens: 700, messages: [{ role: 'user', content: prompt }] })
        });
        const j = await r.json();
        return new Response(JSON.stringify({ text: (j.content && j.content[0] && j.content[0].text) || '' }), { headers: { ...cors, 'content-type': 'application/json' } });
      }
    };

Set `ANTHROPIC_API_KEY` as a secret, `ALLOWED_ORIGIN` to your site, `MODEL` to a current small model, and cap monthly spend in your API account.
