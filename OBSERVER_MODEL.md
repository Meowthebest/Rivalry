# Rivalry: continuous match simulation and tactical observer

Updated 25 October 2026. This upgrades the existing Overwatch mode; other esports,
team/season rosters, player-preference selection, logos, tournament builder and saved
results remain in the same application. All new matches and statistics are fictional.

## What caused the low statistics

The old combat loop advanced roughly 3–5 game seconds per action but delivered only
one small attack/heal opportunity per player. Its effective sustained damage was far
below its intended burst values. Maps were one short 165/240-second phase, not complete
multi-round Control or two-sided payload maps. Objective progress depended primarily
on alive counts rather than physical presence. Generic healing and tank reductions
were not tied to the depicted world. A substitution replaced accumulated player
fields, losing the outgoing player's contribution. The UI offered one undifferentiated
scoreboard and labeled final blows as kills without exposing shared elimination credit.

The new engine fixes the underlying opportunities, health/resources, round lifecycle,
movement and accounting. There is no display multiplier, random scoreboard, preselected
winner, or independently animated player-position layer.

## One authoritative world

`engine/world-sim.js` runs a deterministic 0.2-second fixed step. Actors have positions,
height, facing, health, cooldowns, selected targets, retreat/regroup decisions, death and
respawn cycles. Weapon/ability range and line of sight affect attacks and healing.
`engine/tactical-map.js` supplies the same traversability and LOS geometry to the engine
and observer. Players use a cached four-neighbor navigation graph with ramps; platforms
are visibly distinguished from ground level. The schematic has separate spawn zones,
chokes, lanes, cover and an objective/payload path.

Map names and broad modes are retained from the existing catalog. **Geometry is an
original schematic, not a reconstruction or real player-coordinate dataset.** Map
families share layouts; they are not exact King’s Row, Busan or other in-game geometry.
Blizzard's [map design discussion](https://overwatch.blizzard.com/en-gb/news/23785339/uniting-gameplay-and-style-behind-overwatch-2-s-complex-map-design/)
is a conceptual reference, not a source of surveyed coordinates.

The same state drives the overhead and minimap, hero HUD, kill feed, commentary,
statistics, objectives and ult effects. Effects include directional barriers/windows,
rush corridors, transformed/buffed actors, healing/defensive zones, directional
attacks, gravity/freeze fields and timed projectiles. Personal/channel effects stop
when the actor dies; modeled independent projectiles/buffs can persist. Ability
names/icons are labels for the modeled archetype, not a claim that all 54 current and
historic hero kits are mechanically reproduced.

## Playback

**Watch Live** starts the entire selected series. Setup, rotations, combat, respawns,
round transitions and map transitions advance automatically. At 1×, one second of
simulation time is approximately one wall-clock second. Setup/break clocks also run
at that speed. 0.5×/1×/2×/4×/8× change only the wall-clock accumulator, never combat
coefficients, seeds or RNG draws. Pause freezes the clock and all gameplay state.
Restart explicitly rebuilds the matchup with the same seed. The optional Skip 30s
button is an explicit fast-forward action; normal playback does not skip downtime.
Hidden browser tabs pause rather than silently jumping through a match.

Instant simulation uses the same `step` method and yields between batches. Tournament
matches use that engine too. No alternate instant-result formula exists. Legacy saved
matches remain available, but must be explicitly restarted to use world-version 5.

The expanded observer supports pan, zoom, fit, player selection/follow, fight follow,
name/effect overlays and an always-visible minimap. Hero portraits and sourced team
logos still use existing external image hosts; honest image-failure fallbacks remain.

## Statistics contract

| Field | Model definition |
|---|---|
| Eliminations (E) | Damage participants within 5 seconds before the target's death, including its final-blow player. Shared across eligible participants; not required to sum to opposing deaths. |
| Final blows (FB) | One actor credited for the lethal health-loss event. A fully attributed model has team FB equal to opposing deaths; environmental/unattributed deaths would be separate. |
| Assists (A) | Qualifying recent healing/buff assistance to the killer, separately credited from damage-participation E. This is a declared model convention, not a proven match to every patch/provider. |
| Deaths (D) | Each alive-to-dead transition once. No repeated deaths on an already-dead target. |
| Damage | Effective enemy hero HP removed, capped at available HP. Overkill is excluded. Barrier damage is separately retained in the export. |
| Healing | Friendly missing HP actually restored; no overheal or enemy healing. Recall self-restoration is separately audited rather than attributed to a support. |
| Mitigated | Actual incoming damage prevented by modeled finite barriers or damage-reduction effects. Creating a barrier or overhealth does not award mitigation by itself. |
| Ultimates earned/used | Counted once on readiness and once on actual activation. Charge follows eligible damage/healing and modeled passive gain; not generated during an active personal ultimate. |
| Playing time | Participation in active rounds, including deaths/respawns and rotations; excludes pre-round setup and intermissions. |
| Alive time | The subset of playing time spent alive. |
| Objective time | Alive presence in the objective volume at the correct modeled elevation. |

Each map has a player ledger keyed by side and player identity, with hero-stint
contributions. Substitutions retain the outgoing player's totals and start/restore the
incoming player's own ledger. They are restricted to setup/intermissions. Role-safe
hero swaps at spawn/death/intermissions preserve player totals. Both teams' editors
continue to work.

**Series totals = completed-map ledgers + current-map ledger, exactly once.** Completion
snapshots and clears the current ledger. Completed-map, current-map, and cumulative
series scopes are selectable. Per-10-minute numbers are `sum(stat) * 600 / sum(own
playing seconds)`, never an unweighted mean of map rates. Time is not normalized into
fake minutes. Exports include the raw ledgers and hero-level contributions.

## Public reference data — verified availability, not assumed fields

Primary numerical source: [OWDB public FACEIT-derived data](https://owdb.io/data),
publisher-linked [SQLite gzip snapshot](https://owdb.io/faceit.sqlite3.gz), retrieved
25 October 2026. It is a third-party collector, not an official FACEIT research release.
The [FACEIT Data API documentation](https://docs.faceit.com/api/data/) was inspected;
API access requires a key and generic game-stat dictionaries do not promise arbitrary
Overwatch fields. No private matches, credentials or access controls were bypassed.
The publisher's alternate SQLite download was used after a CSV attempt failed.

The raw snapshot has **102,450 player-map entries**. We exclude unfinished, forfeit,
restarted or incompletely captured games, require all six scoreboard fields, ten unique
players, two teams, and a 1 Tank / 2 Damage / 2 Support role distribution per team.
The complete resulting cohort is **97,500 entries / 9,750 maps / 2,730 series**.

The primary comparison cohort is the explicitly named **Master divisions**: **16,000
player-map entries / 1,600 complete maps / 461 series**, dated **19 June 2026 through
25 October 2026**. Championship names and exact boundaries are in
`calibration/benchmarks.json`. These are organized-league games, **not exclusively
OWCS professional matches**. Repeated player/team observations are not independent;
no statistical significance or population-wide performance claim is made.

Available numerical fields: eliminations, deaths, assists, damage, healing, damage
mitigated, player role and map/game identifiers. **Not supplied:** final blows, reliable
per-map duration, hero playtime, coordinates, detailed events, ultimate counts or patch
IDs. Match start/end are series timestamps, not safe per-map playing time. Thus the
reference supports role/mode **map-total** comparisons but no verified per-10-minute,
exact-era, spatial, or ultimate-frequency calibration. Damage/assist boundaries are
not documented enough to certify exact metric equivalence; comparisons are soft
plausibility checks, not precise tuning targets.

Official OWL StatsLab was investigated but its export could not be retrieved. No
numerical OWL or classic-6v6 calibration is claimed. Current and historical kits,
weapon rates, healing cadence, team form and map timing remain labeled assumptions.

Snapshot SHA256 (compressed):
`9f53db1fb6235bb6f8a6061872caba8db239da68c3d7b8bdede09273b9c9dd60`

Snapshot SHA256 (SQLite):
`b33ccfdb55bdbd5e8a4a579f656e36d25f56f99d5957919f84fd0d52e459687b`

Only aggregate statistics and reproducible extraction code are committed, not a
republication of the full source database or unnecessary player records.

## Validation and remaining calibration differences

`validation/engine-checks.json` records accounting/health/LOS/range/objective tests,
automatic BO3/BO5/BO7 and classic 6v6 completion, and exact identical seeded series
hashes across instant execution and **all five playback speeds**. Pause tests compare
the complete state, not only the visible clock. Browser checks exercise the actual
HTML script order, Watch Live wall timing, pause, 8× playback, pan/zoom/select/follow,
mobile layout, sources dialog, automatic instant series, scopes/rates, JSON export and
seed-preserving restart.

The published distribution test uses **40 maps / 400 player-map observations**: eight
unselected seed indices (actual seeds `997 * index`) across five game modes and four
team pairings. All results are retained. Durations range **225.0–881.4 seconds**, with a
**532.8-second median**, rather than one uniform short phase.

**Calibration remains partial.** Of 55 specified role/mode median checks, 42 fall
inside the reference's 10th–90th-percentile total ranges; 13 do not. This is **not an
accuracy score** or evidence of statistical equivalence. The individual distributions,
fractions within range, and all residual differences are published in
`validation/calibration-report.json`. Notably some elimination/death distributions
still differ. Unknown reference durations, hero/patch mix, simplified geometry and
small model samples limit interpretation. No displayed statistic was scaled to hide
a mismatch.

## Ruleset limitations

Control models first-to-two point rounds. Flashpoint models first-to-three objectives
with continuous rotations and a short new-point unlock, retaining health, ultimates
and respawn state. Push models robot return and barricade progress. Hybrid/Escort model
two attack phases and checkpoints; equal full clears use a **faster-clear model
 tiebreak**, not official overtime time-bank rounds. A maximum-round guard declares a
draw rather than inventing a random winner. Schematic spawn distances, shared map
families, simplified hero/ability archetypes, absent exact patch-level behavior and
unverified historical performance remain explicit limitations.

## Reproduce

```sh
node tests/world-invariants.cjs
node tests/lineup-engine.cjs
node tests/world-sample.cjs 8 validation/model-maps.json
python calibration/compare-model.py validation/model-maps.json
# Rebuild source aggregates from the exact public SQLite snapshot (pandas required):
python calibration/extract-benchmarks.py /path/to/faceit.sqlite3
# Real browser checks (Playwright + BeautifulSoup + system Chromium):
python tests/browser-local.py
```

See `validation/browser-checks.json`, `validation/engine-checks.json`,
`validation/calibration-report.json`, and the GitHub Actions checks for the actual
results. Model/source hashes identify the tested numerical engine. The standalone
raw batch can be regenerated and is an optional CI artifact; it is not the source of
truth for in-game scoreboards.
