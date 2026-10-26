# Rivalry connected esports platform

This is an in-place extension of Rivalry. The original match creator, seasonal archives,
hero preferences, team logos, custom tournaments, other esports and world-v5 overhead
observer remain available under **Match simulator**. The new homepage is a sourced
information hub; real match records are not simulation results.

## What is connected

- **Liquipedia MediaWiki API**: explicit 2026 OWCS Stage 2/Stage 3 pages for EMEA, NA,
  Korea, Japan, China and Pacific. Requests use a descriptive contact User-Agent,
  gzip, caching and at least 31 seconds between parse requests. This is API access,
  not an automated crawl of non-API wiki HTML. The source adapter is versioned and
  fails visibly when the supported structure changes.
- **OWDB's public FACEIT-derived SQLite download**: recorded matches, provider team/
  player IDs, map results and captured scoreboard totals. This is a third-party
  public data collector, not an official FACEIT research release.
- **FACEIT Data API**: optional server-side adapter, disabled unless the repository
  secret `FACEIT_API_KEY` and variable `FACEIT_CHAMPIONSHIP_IDS` are configured. The
  variable is a comma-separated list of authorized championship IDs. Keys never
  appear in browser code, cached outputs, logs or the published site.
- **OWTV**: permission required; no systematic/automated OWTV extraction is enabled.
  No undocumented private endpoint is used.

Source references:
- https://liquipedia.net/api-terms-of-use
- https://liquipedia.net/overwatch/Main_Page
- https://owdb.io/data
- https://owdb.io/faceit.sqlite3.gz
- https://docs.faceit.com/api/data/
- https://owtv.gg/terms

The retrieved 26 October 2026 test build contains 3,525 real match records, 384 provider
team identities, 32 events, 2,598 player identities and 5,590 dated squad/lineup observations.
These counts are **not a claim of complete professional Overwatch history**. The initial
snapshot has 18 scheduled OWCS fixtures and 3,456 completed FACEIT records. It does not
contain a verified live match or future FACEIT fixture. The Live tab is intentionally
empty when no fresh source explicitly reports a live status. Numbers change on refresh.

## Data and freshness rules

Every normalized entity has a stable or explicitly derived ID, public source URL,
verification type and timestamp. Provider identities are not automatically merged
across unrelated sources merely because their display names match. FACEIT display
names can be current labels and are marked as such, not asserted historical branding.

Liquipedia entries without native match IDs use event/opponents/date identities and
conservative reconciliation. A changed schedule is linked to an earlier ID only when
unambiguous. Removal from an API response does not prove cancellation. Old completed
records are retained; unmatched scheduled records become unconfirmed.

A scheduled timestamp never proves **live** or **completed**. A scheduled match whose
time has passed is shown as **status unconfirmed**, not upcoming. Live status expires
when not recently verified. Date-only/midnight schedule entries do not receive a
fabricated clock time or precise countdown. The UI preserves the provider's date text.

The generic Liquipedia upcoming/ongoing endpoint returned old 2025 fixtures during
inspection. Those rows were not imported as current matches. Explicit dated 2026
competition pages are used instead. No demonstration fixtures are in production data.

Incomplete FACEIT map captures are not summed into a fake final series score. A numeric
final score is published only when the known format, captured winning-map threshold and
provider-reported winner agree. Otherwise the result/winner remains known but the final
score is marked unavailable. Raw map scores and scoreboard coverage remain visible.

### Rosters are observations, not invented transfers

A published event squad is labeled **starting five projected**. A FACEIT scoreboard
lineup is an observation for that recorded match, not a current contract. Upcoming
lineups may be projected from the latest prior observation and are labeled accordingly.
No future observed lineup is used for an older match. A role-incomplete squad cannot
silently launch a source-backed simulation. The source link and missing roles are shown.

Player profiles distinguish documented nationality, role observations and dated team
appearances. They do not turn changes in observed squads into fabricated signing,
retirement or transfer announcements. No measured most-played hero ranking is fabricated;
existing suggested player pools retain that label.

## Scheduled synchronization and deployment

`.github/workflows/pages.yml` runs on main pushes, manual dispatch and at minutes 17/47
of each hour. GitHub may delay scheduled jobs. On each run:

1. Restore source cache **and** generated profile/statistic shards.
2. Refresh current OWCS pages (30-minute cache), previous-stage pages (daily cache),
   OWDB (3-hour cache), and optional authorized FACEIT data (15-minute cache).
3. Check schemas, normalize entities, preserve first-observed completion timestamps,
   retain source records during partial outages, and publish provenance/freshness.
4. Fit fixed-parameter ratings, run chronological validation and source/model tests.
5. Stage public assets, excluding source databases, caches, credentials and dependencies.
6. Deploy the tested static website through GitHub Pages.

If a provider fails, last-known records keep their old verification timestamps and the
UI displays the outage. If no usable record or cache exists, deployment stops rather
than replacing the existing site with fabricated/empty data. Schema failures are visible.

The public website fetches generated same-origin JSON; it never calls restricted feeds
from a visitor's browser or exposes a server key. Browser localStorage is only an
additional last-known catalog fallback. The source cache is not a public site asset.

To reproduce from downloaded audit inputs:

```sh
pip install beautifulsoup4==4.14.3
python platform/sync.py --offline-dir /path/to/permitted-source-audit
node platform/fit.cjs
python tests/platform-sources.py
node tests/platform-model.cjs
python platform/stage.py
```

## Prediction model and evidence

`platform/model.js` implements a disclosed baseline: prior Elo 1500, K=24, 120-day
inactivity decay, small-sample shrinkage toward 50%, and a conservative map adjustment
only when both teams have at least three recorded observations of that map. Unknown
maps receive no invented advantage. Team names do not determine strength. Disconnected
result pools are not forced into a global ranking.

Predictions require at least three prior completed series per team and an evidence
connection between the teams. Team/organization continuity is not proof of lineup
continuity; roster/hero/patch effects remain limitations, not fabricated model features.

Results with real start/end timestamps enter historical validation only after they
actually finished. Records without finish timestamps enter present-day ratings only
after first observation of completion, using the published date as a recency proxy;
they are excluded from held-out testing. A target match's outcome and future results
are not available to its pre-match model. Source correction history is not available:
this is a chronological evaluation of the retrieved snapshot, not a claim of archived
real-time prediction performance or proof against all retrospective data corrections.

Initial evaluation: fixed parameters, last 20% by start timestamp, 534 eligible held-out
FACEIT series from a 2,751-series timestamp-complete cohort. Brier score **0.23666**
versus **0.25** for a 50/50 baseline; log loss **0.66628** versus **0.69315**. Most
predictions are near 50%; the small tail bins are not reliable evidence of precision.
No parameter search was performed on the held-out sample. This is a modest baseline,
not a validated betting product or demonstrated OWCS-professional predictor. The full
reliability bins and per-prediction cutoff checks are downloadable in Model & analytics.

The 100/1,000/10,000 controls run independent, seeded **statistical map-outcome series
simulations in a Web Worker**. They compute win frequencies, stopping-score distributions
and Monte Carlo sampling intervals. These are not 10,000 full tactical combat replays.
Sampling error is not the model's total uncertainty. Analytical score mass sums to one.

### Connection to Watch Simulation Live

A real match's source-linked squad is passed to the existing world engine with its
format, season and source context. Unknown formats are explicitly user-selected scenario
settings. Records are never rewritten with the simulated score.

For these source-fixture scenarios, actors use neutral baseline skill rather than
organization-name hashes. When a prediction is supported, a bounded team skill modifier
(maximum ±0.055) expresses its direction; that mapping is a declared scenario assumption.
**The full tactical engine's win rate is not claimed to equal the statistical prediction.**
The outcome is not preselected and real historical results are not forced to recur.

Existing combat accounting, live/instant deterministic playback, overhead positioning,
ultimate visuals and per-map/series statistics remain authoritative. See OBSERVER_MODEL.md
for actual gameplay calibration and its remaining residuals; those findings are not
replaced by this predictive model's evaluation.

## Verified functionality

New tests cover API/schema failures, result terminal states, source URLs, duplicate IDs,
completed scores, missing roles, exact dated lineups, no future-result leakage, disconnected
pools, reproducible 100/1k/10k draws and probability mass.

A real Chromium browser run loads the exact project HTML/CSS/script order and actual
published data with local transport. It exercises home/real fixtures, match center,
event-squad handoff into the existing world-v5 observer with autoplay, result search,
10,000 real Worker draws, team roster selection, mobile navigation and 390px layouts.
Third-party image availability is not asserted by the offline browser test. Recorded
checks are under `validation/platform/`; rerun with `tests/platform-browser.py` after
generating source data. Existing engine and lineup regression tests remain in CI.

## Remaining limits (not hidden behind decorative sections)

- This is not an exhaustive live feed of all OWCS, OWL, World Cup and qualifier events.
  The twelve configured tournament pages must be updated when new stages/years begin.
- All historical roster transfers, official announcements, news, trending popularity,
  exact patch models and measured professional hero usage are not complete or available.
  No fabricated news/trending/transfer cards were added to imply otherwise.
- Tournament wins/losses are explicitly computed from imported results, not asserted
  official standings or a reconstructed complete bracket.
- Cross-provider identities stay separate until supported by a curated mapping.
- Real match pages have shareable links; full simulation history remains local to the
  browser with the existing export/replay facilities, not a hosted multi-user replay store.
- Gameplay maps remain labeled schematics; several hero kits are modeled archetypes.
  The simulation is fictional, not an authentic replay of real coordinates/events.
- Logo/artwork rights stay with their owners. Attribution and source-hosted assets are
  not claims of a blanket redistribution license. Liquipedia-derived data is attributed
  to its contributors under CC BY-SA 3.0 with source links; normalized changes are noted.
