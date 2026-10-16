# NOVATECH Risk Watch

Live risk dashboard built for the ESAIP Risk Management "Risk Detective" case (NOVATECH SERVICES).

**Team:** Anish, Mereena, Sudheer, Fatah, Rambabu, Krishna, Niranjan

## What it does

- **Risk register** of 16 risks, scored likelihood × impact (1–16), with a heat map before action, now, and after the mitigation plan.
- **Alerts before the risk hits:** 22 early-warning indicators (KRIs) with amber and red thresholds, plus trend-based early warnings.
- **Persistent notifications:** open alerts pop up when the page opens and repeat (sound and desktop notification if allowed). Acknowledging snoozes an alert for 5 minutes; every reload brings all open alerts back.
- **Phone alerts:** push notifications to the team's phones through the free ntfy app (channel set in *Phone alerts & help*), when a reading turns red or amber, when a clue arrives, and as a reminder while alerts stay open.
- **Live clue feed:** the facts from the NOVATECH dossier, plus every clue the team logs; a clue can raise a risk's likelihood or impact.
- **Mitigation plan:** 9 actions with owner, deadline, cost and status; progress lowers the current risk scores.
- **Benefits:** expected annual loss before and after the plan, and loss avoided per euro spent (team estimates, editable).

## Use it

Open `index.html` in a browser, or the GitHub Pages site. Data is saved in the browser (localStorage) and syncs live between open tabs; use **How it works → Download backup / Load a backup** to move it between computers.

Single static file: no build step, no server, no external scripts (Google Fonts only).
