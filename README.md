# Rivalry — Overwatch History & Esports Match Simulator

An independent, **fictional** esports simulator featuring Overwatch, VALORANT, League of Legends and Rocket League, with an interactive Overwatch archive covering historical OWL franchises (2018–2023), curated OWCS 2024–2025 teams, and the OWCS 2026 Stage 3 regional snapshot.

## Website / publishing
GitHub Pages: **https://meowthebest.github.io/Rivalry/** (available only after Pages is enabled).

**Required one-time GitHub repository setting:** open **Settings → Pages → Build and deployment → Source → GitHub Actions**. A Pages workflow already exists at `.github/workflows/pages.yml`, but GitHub cannot run it successfully before the repository owner enables Pages. After updating the setting, go to **Actions → Publish Rivalry to GitHub Pages → Re-run all jobs**, or push another commit to `main`.

## How to play
1. Choose Overwatch 2, VALORANT, League of Legends or Rocket League.
2. Pick teams and a match format. The Overwatch directory supports all 22 original/rebranded OWL team identities plus historical OWCS participants.
3. Choose **Auto** / **Classic 6v6** / **Modern 5v5** and a starting map for Overwatch.
4. Simulate coach-directed tactical calls or use spectator auto-play.
5. Explore the 2018–2026 timeline, world champions, classic rivalries and the clickable hero dossier panels.

## Repository files
- `index.html`: site
- `style.css` / `archive.css`: responsive interface and timeline styling
- `teams.js`: dated 2026 Stage 3 participant snapshot, maps, modern hero compositions
- `archive.js`: historical OWL & OWCS team profiles, citations and classic 6v6 compositions
- `app.js`: fictional round-by-round engine, maps, tactics and local match history
- `archive-ui.js`: season selection, championship timeline, rivalry builder and hero dossiers
- `assets/arena.svg`: original esports-themed illustration, **not** a copied game asset
- `favicon.svg`: original Rivalry icon
- `.github/workflows/pages.yml`: GitHub Pages deployment workflow

## Historical sources and asset policy
- [Liquipedia Overwatch](https://liquipedia.net/overwatch/Main_Page) — OWL, OWCS, events and participant history
- [Overwatch Wiki](https://overwatch.fandom.com/wiki/Overwatch_Wiki) — hero and game references
- [Overwatch League history](https://liquipedia.net/overwatch/Overwatch_League)
- [OWCS 2024 World Finals](https://liquipedia.net/overwatch/Overwatch_Champions_Series/2024/World_Finals)
- [OWCS 2025 World Finals](https://liquipedia.net/overwatch/Overwatch_Champions_Series/2025/World_Finals)
- [Overwatch Esports — official](https://esports.overwatch.com/en-us)
- [Blizzard official press center](https://blizzard.gamespress.com/Overwatch)

**Copyright:** Blizzard and professional esports team trademarks/artwork remain the property of their owners. We do not bulk copy or mirror Wikis/Liquipedia images or proprietary Blizzard assets. Research sources are cited and linked instead; the website uses an original vector arena artwork. Overwatch Wiki content has CC BY-NC-SA restrictions where its contributors can license it; proprietary third-party game assets may have separate rights.

## Disclaimer
Unofficial, noncommercial fan project. Not affiliated with Blizzard, Liquipedia, Fandom, OWL, OWCS, publishers or esports organizations. Match results, probabilities, rosters displayed in simulated compositions, and tactics are **fictional**, and not live matches or predictions. Archive lists are curated, not a complete census of every open qualifier entrant; player listings are not guaranteed starters. Browser data is saved locally; no backend or API key is required.
