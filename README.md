# NOVATECH Risk Watch

Live risk dashboard built for the ESAIP Risk Management "Risk Detective" case (NOVATECH SERVICES), plus a **start-up co-pilot** that maps the risks of any new company. Available in **English and French**.

**Team:** Anish, Mereena, Sudheer, Fatah, Rambabu, Krishna, Niranjan

Site: https://ar-base.github.io/novatech-risk-watch/ · co-pilot direct link: https://ar-base.github.io/novatech-risk-watch/#copilot

## What it does

**NOVATECH case**
- **Risk radar:** the 16 risks as dots, one slice per analyst; the closer to the centre, the higher the score. Switch between before actions, now and after the plan.
- **Risk register** scored likelihood × impact (1–16), with a heat map.
- **Alerts before the risk hits:** 22 early-warning indicators with amber and red thresholds, plus trend-based early warnings.
- **Persistent notifications:** open alerts pop up when the page opens and repeat. Acknowledging snoozes an alert for 5 minutes; every reload brings all open alerts back.
- **Phone alerts** through the free ntfy app (channel set in *Phone alerts & help*).
- **Live clue feed, mitigation plan (9 actions) and benefits** (expected annual loss before and after the plan).

**Start-up co-pilot** (for anyone starting a company)
- **Ten everyday questions** produce a personal risk radar and a plan: for each risk, why it matters for *this* business, one action for this week with a rough cost, and one number to watch.
- **"Something happened?"**: describe an incident in your own words; it finds the risks it points to, suggests raising them, and lists what to do today.
- **Weekly briefing** sent to your phone.
- **Two engines:** a built-in engine (instant, free, private, works offline) and optional **Claude AI** for a personalised analysis. If the AI cannot answer, the built-in engine takes over.

## Turning on Claude AI

Two ways, chosen in *Start-up co-pilot → Analysis engine*:

1. **My key:** each user pastes their own Claude API key (from console.anthropic.com). It is stored only in that browser and sent only to Anthropic.
2. **AI server (recommended for a class or team):** one shared server holds the key, so visitors need nothing. Free on Cloudflare Workers.

   **One click:** [![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/AR-base/novatech-risk-watch/tree/main/ai-server) — sign in to Cloudflare, paste your Claude key in the `ANTHROPIC_API_KEY` field, click *Create and deploy*, then copy the `…workers.dev` address into *Analysis engine → Claude: AI server*.

   **Or by hand:**
   1. Create a free account at dash.cloudflare.com → *Workers & Pages* → *Create* → *Create Worker*, name it `novatech-ai`, then *Edit code* and paste the contents of [`ai-server/worker.js`](ai-server/worker.js). Click *Deploy*.
   2. In the worker's *Settings → Variables and secrets*, add a **secret** `ANTHROPIC_API_KEY` with your Claude key. Optionally add `ALLOWED_ORIGINS` (default `https://ar-base.github.io`).
   3. Copy the worker address (`https://novatech-ai.<your-name>.workers.dev`) into *Analysis engine → Claude: AI server* and press *Test connection*.

   The server only accepts calls from the dashboard's own address, fixes the model (Claude Haiku 4.5) and answer length, limits request size, and allows a few calls per visitor per minute. The key never reaches the browser.

## Privacy and data

Everything is saved in the browser (localStorage) on the device you use. Co-pilot answers and incidents never leave the device unless Claude AI is switched on, in which case they are sent to Anthropic for the analysis. Use *Phone alerts & help → Download backup / Load a backup* to move NOVATECH data between computers.

Single static page: no build step, no external scripts (Google Fonts only). The previous design is kept at `classic.html`.
