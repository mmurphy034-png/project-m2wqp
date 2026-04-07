# MLB Win% vs Betting Apps

A lightweight dashboard that compares live Major League Baseball win percentage with how betting apps are pricing teams right now.

## Data sources

- Live standings: MLB Stats API
- Current moneylines: The Odds API (`baseball_mlb`, `h2h`, `us`)

## What it measures

- `Record win%`: wins divided by games played
- `Market implied win%`: implied probability from current moneyline odds
- `Gap`: `market implied win% - record win%`

Positive gap:

- betting apps are pricing a team stronger than its current record

Negative gap:

- betting apps are pricing a team weaker than its current record

## Setup

Add this environment variable in Vercel:

`ODDS_API_KEY`

## Notes

- This uses current moneylines, so it reflects near-term game pricing rather than full-season futures.
- Team mapping is based on current MLB team names returned by MLB Stats API and The Odds API.
