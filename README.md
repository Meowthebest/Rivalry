# Rivalry — Esports Match Simulator

[Open Rivalry](https://meowthebest.github.io/Rivalry/)

Rivalry is an unofficial, fictional esports simulator. The existing Overwatch team and
season archive, player-role lineups, hero selection, source-attributed logos, tournament
builder, replay timeline, and VALORANT / League of Legends / Rocket League modes are
retained in one application.

## Watch an Overwatch series

1. Select teams, exact seasons, ruleset, maps and a BO3 / BO5 / BO7 format.
2. Start the matchup and press **Watch Live**. Rounds and maps progress automatically.
3. Use Pause / Resume / Restart, 0.5× / 1× / 2× / 4× / 8×, or Instant Series.
4. Expand the tactical observer. Pan, zoom, select/follow a player, follow the fight,
   and toggle names or ability overlays. The persistent minimap reflects the same world.

At 1×, simulation time advances approximately one second per wall-clock second.
Downtime is not automatically skipped. Changing speed never changes the engine seed or
combat rules. Hidden tabs pause. Old saved matches must be explicitly restarted to use
the new world engine; their recorded result history is not rewritten.

## Statistics and simulation

The fixed-step engine drives player movement, line of sight, ranges, finite barriers,
healing, attacks, cooldowns, ultimate use, respawns and objectives. Every displayed
statistic comes from those same interactions. The observer is not an independent dot
animation.

The scoreboard separates **Eliminations / Final Blows / Assists / Deaths**, effective
hero damage, healing and mitigation. Detailed ledgers also preserve barrier damage,
ultimate counts, playing/alive time, objective time and hero-stint contributions.
Completed-map, current-map and series views reconcile without double-counting. Per-10
rates use total contribution divided by the player's own total active-round playing
time. Substitutions preserve outgoing players' contributions.

**The model is not the official game engine.** Geometry is a labeled original schematic,
not a surveyed reconstruction of Overwatch maps. Kits, movement, timing and some match
rules are simplified. A full-clear payload tie currently uses a documented faster-clear
model tiebreak, not the official time-bank extension.

## Evidence and limitations

[OBSERVER_MODEL.md](OBSERVER_MODEL.md) documents the cause of the previous low totals,
all metric definitions, public sources, exact sample filters, missing fields and tests.

The reference is the publisher-linked [OWDB FACEIT-derived dataset](https://owdb.io/data),
retrieved 25 October 2026. The primary cohort contains **1,600 complete Master-division
maps / 16,000 player-map records / 461 series**, not exclusively OWCS professional games.
The source lacks final blows, per-map duration, detailed coordinates, ultimate counts
and exact patch IDs. No verified reference per-10 rates are invented.

Calibration is partial. The published 40-map, 400-player-map batch includes every tested
seed; remaining mode/role differences are visible in
[the comparison report](validation/calibration-report.json). Accounting correctness and
seed invariance do not prove equivalence to professional performance.

Historical roster coverage is also partial. The application never fills unknown roles
with invented professional players. Missing coverage is disclosed before launch;
explicit practice slots are not verified players. Player hero preferences are labeled
suggestions unless a source-backed seasonal usage sample is supplied.

## Main modules

- `engine/tactical-map.js`: traversable schematic geometry, ramps, pathfinding and LOS.
- `engine/world-sim.js`: authoritative fixed-step gameplay and per-player ledgers.
- `engine/playback-clock.js`: real-time accumulator and identical instant simulation.
- `ui/tactical-observer.js` / `.css`: overhead camera, minimap, effects and player inspector.
- `studio.js`: broadcast HUD, playback controls, statistics, tournament/history integration.
- `engine/player-lineups.js`, `data/*`, `ui/lineup-controls.js`: existing exact-season
  rosters, hero preferences, legal selections and both-team controls.
- `ui/team-logos.js`: existing source-attributed logo references and honest fallbacks.
- `calibration/*`: public aggregate benchmarks and reproducible extraction/comparison.
- `validation/*`, `tests/*`: checked results and reproducible regression suites.

## Run locally and test

No build step is required. Serve the repository root, for example:

```sh
python -m http.server 8000
node tests/world-invariants.cjs
node tests/world-sample.cjs 8 validation/model-maps.json
python calibration/compare-model.py validation/model-maps.json
npm install --no-save --no-package-lock jsdom@26
node tests/smoke.cjs
node tests/lineup-engine.cjs
node tests/lineup-browser.cjs
```

A real-browser test is provided in `tests/browser-local.py` (Playwright,
BeautifulSoup and Chromium required). It tests exact project scripts/CSS in memory;
third-party image hosts are intentionally unavailable and are not certified by that test.
GitHub Actions run the accounting, seeded playback, calibration batch and existing UI
regressions. GitHub Pages publishes `main` using the existing workflow.

## Attribution

Competition and roster references include Liquipedia, official Overwatch esports and
source-linked tournament records. Hero artwork is requested through OverFast with
fallbacks; team logos use the existing credited public source URLs. Original schematic
art is not Blizzard map art. Logos and game artwork remain their owners' property;
source attribution is not a claim of a redistribution license.

Not affiliated with Blizzard, FACEIT, OWDB, Liquipedia, teams or tournament organizers.
All simulated matches, coordinates and results are fictional. Browser-local saves
remain on the user's device. No private match credentials or hidden telemetry are used.


## Connected platform upgrade — 26 October 2026

The default homepage now provides sourced OWCS fixtures, FACEIT recorded results, team/player/event profiles, result-based model explanations, reproducible 100/1,000/10,000 statistical series draws, and a real-fixture handoff into the existing Watch Live observer. Match simulator retains the prior archives, other esports and custom tournament modes.

See [PLATFORM.md](PLATFORM.md) for source permissions, 30-minute scheduled publication, optional server-side FACEIT configuration, metric definitions, held-out validation, data limits and tests. Generated source data is built by the Pages workflow, not checked into Git; raw source caches are excluded from deployment.
