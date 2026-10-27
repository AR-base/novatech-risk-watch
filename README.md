# NOVATECH Risk Watch

Live risk dashboard built for the ESAIP Risk Management "Risk Detective" case (NOVATECH SERVICES), plus a **start-up co-pilot** that maps the risks of any new company. Available in **English and French**.

**Team:** Anish, Mereena, Sudheer, Fatah, Rambabu, Krishna, Niranjan

Story site (poster wall of the sixteen risks, live numbers): https://ar-base.github.io/novatech-risk-watch/story/ · open one risk directly with `story/#risk=R2` or in the dashboard with `#risk=R2`

Site: https://ar-base.github.io/novatech-risk-watch/ · co-pilot direct link: https://ar-base.github.io/novatech-risk-watch/#copilot

## What it does

**NOVATECH case**
- **Risk radar:** the 16 risks as dots, one slice per analyst; the closer to the centre, the higher the score. Switch between before actions, now and after the plan.
- **Risk register** scored likelihood × impact (1–16), with a heat map.
- **Alerts before the risk hits:** 22 early-warning indicators with amber and red thresholds, plus trend-based early warnings.
- **Persistent notifications:** open alerts pop up when the page opens and repeat. Acknowledging snoozes an alert for 5 minutes; every reload brings all open alerts back.
- **Phone alerts** through the free ntfy app (channel set in *Phone alerts & help*).
- **Live clue feed, mitigation plan (9 actions) and benefits** (expected annual loss before and after the plan).
- **Live radar:** marking an action done, reassessing a risk or logging an indicator moves the dot straight away, with a trail, a ripple and a badge ("−2 · Moderate" or "−18%"). The *Radar logbook* under the headline says who changed what.
- **Team database (Redis):** all dashboards share one database, so a change on any laptop shows on every screen within about 3 seconds. Without it, each computer keeps its own data.
- **Incident cost on Contain:** every dashboard shows the damage already done, the loss avoided by containing and the worst case, the cost of each hour of delay and where the damage comes from. Worst case = the € cost of the risk's impact level (Benefits tab); damage grows from the alert to containment at a speed set per risk. The *avoided* amount is secured step by step as the response is completed.
- **Hand control** (site and dashboard): the *Hand control* button turns on the laptop camera; MediaPipe Hand Landmarker runs in the browser and the video never leaves the device. Point with your index finger to move the cursor and open posters, pinch thumb and index to click, close your fist to go back, point at the top or bottom edge to scroll. Needs internet the first time to load the model.
- **CEO approval:** *Contain* becomes a request to the CEO (Krishna by default). The CEO's phone gets *Approve* / *Reject* buttons with the damage so far, the worst case and the cost of each hour of waiting; every dashboard shows the request with a live waiting counter. The playbook, phone tasks and laptop isolation start only after approval; a rejection records that the CEO accepts the risk for now. Policy (always, above €300k or €1.2M, never) and who plays the CEO: *Phone alerts & help → CEO approval*.
- **Incident response:** alerts go to the phone of each responsible person; *Contain* sends every step owner their task with a *Done* button; containing R2, R5 or R16 isolates the demo laptop (`#device=LAPTOP-07`, or `demo/device-agent.bat` on a real Windows PC).

**Start-up co-pilot** (for anyone starting a company)
- **Ten everyday questions** produce a personal risk radar and a plan: for each risk, why it matters for *this* business, one action for this week with a rough cost, and one number to watch.
- **"Something happened?"**: describe an incident in your own words; it finds the risks it points to, suggests raising them, and lists what to do today.
- **Weekly briefing** sent to your phone.
- **Two engines:** a built-in engine (instant, free, private, works offline) and optional **Claude AI** for a personalised analysis. If the AI cannot answer, the built-in engine takes over.

## Requirements

| What | Needed for | Cost |
|---|---|---|
| A modern browser (Chrome, Edge, Safari, Firefox) | the dashboard | free |
| The **ntfy** app on each phone, one personal channel per teammate | phone alerts and *Done* buttons | free |
| A **Cloudflare** account with the worker `novatech-risk-watch` (this repo deploys it automatically) | AI server and team database | free plan |
| An **Upstash Redis** database (console.upstash.com) | shared team database | free plan |
| A Claude API key (`sk-ant-api03-…`) from console.anthropic.com | optional Claude analysis in the co-pilot | pay per use |
| Windows PowerShell | optional real lock / shutdown in the demo (`demo/device-agent.bat`) | built in |

## Team database (Redis)

1. Create a free Redis database at [console.upstash.com](https://console.upstash.com) (region near Paris).
2. In the database page, section **REST API**, copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
3. Cloudflare → Workers & Pages → `novatech-risk-watch` → Settings → Variables and Secrets → **Add**, type *Secret*, once for each name and value. Click **Deploy**.
4. Open the worker address: the status page must say `Team database (Redis): CONNECTED`. Then open the dashboard: the header shows *Live · team database (Redis)*.

The first dashboard that connects copies its data into the empty database; every other dashboard then loads it. The server (`ai-server/teamdb.js`) only accepts the dashboard's own website, checks every record (allowed collections, size, count), limits requests per visitor and keeps the last 300 changes in an audit list (`nrw:audit`). Redis keys: `nrw:docs` (hash of records), `nrw:v` (version, +1 per change).

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

Everything is saved in the browser (localStorage) on the device you use and, when the team database is set up, in the team's Redis database. Co-pilot answers and incidents never leave the device unless Claude AI is switched on, in which case they are sent to Anthropic for the analysis. Use *Phone alerts & help → Download backup / Load a backup* to move NOVATECH data between computers.

Single static page: no build step, no external scripts (Google Fonts only). The previous design is kept at `classic.html`.
