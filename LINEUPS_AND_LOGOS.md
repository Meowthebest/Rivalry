# Both-team lineups, player preferences and team logos

## Team 2 correction
Both sides now share a normalized team + exact-season resolver. A newly selected opponent cannot inherit a stale year from the previous selection. The match form checks every required role before launching. Incomplete sourced data produces a preflight warning with available seasons; only an explicit practice-mode choice can generate visibly unverified slots.

The lineup editor has separate Team 1 and Team 2 tabs, role-safe substitutions, and unique hero selections. Old saved matches are not rewritten under a new roster: a restart notice lets the user rebuild the matchup while preserving the old event history.

## Hero-selection truthfulness
Automatic choices use seasonal measured playtime **when a source-backed dataset is supplied**, then player-specific suggested pools, then a role fallback. There is no complete measured playtime dataset included in this release. Suggested pools are explicitly labeled and are **not** claims about each professional's most-played hero. No playtime percentages are invented.

Optional `window.RIVALRY_HERO_USAGE` records accept `player`, `team`, `season`, `hero`, positive numeric `seconds`, public HTTPS `source`, and descriptive `scope`. Data must match the selected year and player. Aggregation and ranking are covered by a synthetic test fixture, not passed off as real esports data. Heroes remain role- and release-year constrained and cannot duplicate another active pick.

## Logos and attribution
The source manifest maps confirmed public OWTICS/over.gg logo URLs to 111 of the 115 directory profiles. Four profiles still use clearly labeled neutral initials. Logo artwork remains hosted by the source; no binaries are mirrored in this repository. Organizations retain all logo and trademark rights. A source URL is attribution, not a claim of a free redistribution license. Branding variations are **not guaranteed historically exact** for every year.

Credits are accessible in the broadcast footer and logo tooltips. Image loading failures fall back visibly, with no retry loop or invented branding.

## Regression tests
Run `node tests/lineup-engine.cjs`, then `npm install --no-save --no-package-lock jsdom@26` and `node tests/lineup-browser.cjs`. The workflow `.github/workflows/lineups.yml` runs them on pushes. Tests cover both sides, aliases, stale years, supported historical rosters, opponent substitutions, duplicate prevention, missing-data preflight, save migration notices, logos and failed-image accessibility.
