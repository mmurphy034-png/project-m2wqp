const CACHE_TTL_MS = 5 * 60 * 1000;
const GAMES_IN_SEASON = 162;
const MLB_STANDINGS_URL = "https://statsapi.mlb.com/api/v1/standings";

const TEAM_MARKET_BASELINES = {
  BAL: { preseasonWinTotal: 87.5, playoffOdds: -105, nextGameMoneyline: -112, teamUrl: "https://www.mlb.com/orioles" },
  BOS: { preseasonWinTotal: 81.5, playoffOdds: 145, nextGameMoneyline: 102, teamUrl: "https://www.mlb.com/redsox" },
  NYY: { preseasonWinTotal: 90.5, playoffOdds: -325, nextGameMoneyline: -145, teamUrl: "https://www.mlb.com/yankees" },
  TB: { preseasonWinTotal: 79.5, playoffOdds: 180, nextGameMoneyline: 108, teamUrl: "https://www.mlb.com/rays" },
  TOR: { preseasonWinTotal: 86.5, playoffOdds: -115, nextGameMoneyline: -118, teamUrl: "https://www.mlb.com/bluejays" },
  CWS: { preseasonWinTotal: 62.5, playoffOdds: 1600, nextGameMoneyline: 150, teamUrl: "https://www.mlb.com/whitesox" },
  CLE: { preseasonWinTotal: 84.5, playoffOdds: -120, nextGameMoneyline: -122, teamUrl: "https://www.mlb.com/guardians" },
  DET: { preseasonWinTotal: 83.5, playoffOdds: -110, nextGameMoneyline: -118, teamUrl: "https://www.mlb.com/tigers" },
  KC: { preseasonWinTotal: 82.5, playoffOdds: 130, nextGameMoneyline: 102, teamUrl: "https://www.mlb.com/royals" },
  MIN: { preseasonWinTotal: 84.5, playoffOdds: 115, nextGameMoneyline: -104, teamUrl: "https://www.mlb.com/twins" },
  HOU: { preseasonWinTotal: 88.5, playoffOdds: -140, nextGameMoneyline: -126, teamUrl: "https://www.mlb.com/astros" },
  LAA: { preseasonWinTotal: 73.5, playoffOdds: 475, nextGameMoneyline: 125, teamUrl: "https://www.mlb.com/angels" },
  ATH: { preseasonWinTotal: 69.5, playoffOdds: 900, nextGameMoneyline: 138, teamUrl: "https://www.mlb.com/athletics" },
  SEA: { preseasonWinTotal: 85.5, playoffOdds: -105, nextGameMoneyline: -118, teamUrl: "https://www.mlb.com/mariners" },
  TEX: { preseasonWinTotal: 84.5, playoffOdds: 120, nextGameMoneyline: -102, teamUrl: "https://www.mlb.com/rangers" },
  ATL: { preseasonWinTotal: 93.5, playoffOdds: -275, nextGameMoneyline: -155, teamUrl: "https://www.mlb.com/braves" },
  MIA: { preseasonWinTotal: 72.5, playoffOdds: 500, nextGameMoneyline: 120, teamUrl: "https://www.mlb.com/marlins" },
  NYM: { preseasonWinTotal: 88.5, playoffOdds: -135, nextGameMoneyline: -124, teamUrl: "https://www.mlb.com/mets" },
  PHI: { preseasonWinTotal: 91.5, playoffOdds: -240, nextGameMoneyline: -148, teamUrl: "https://www.mlb.com/phillies" },
  WSH: { preseasonWinTotal: 70.5, playoffOdds: 1100, nextGameMoneyline: 142, teamUrl: "https://www.mlb.com/nationals" },
  CHC: { preseasonWinTotal: 86.5, playoffOdds: -110, nextGameMoneyline: -118, teamUrl: "https://www.mlb.com/cubs" },
  CIN: { preseasonWinTotal: 79.5, playoffOdds: 165, nextGameMoneyline: 104, teamUrl: "https://www.mlb.com/reds" },
  MIL: { preseasonWinTotal: 82.5, playoffOdds: 105, nextGameMoneyline: -108, teamUrl: "https://www.mlb.com/brewers" },
  PIT: { preseasonWinTotal: 76.5, playoffOdds: 260, nextGameMoneyline: 112, teamUrl: "https://www.mlb.com/pirates" },
  STL: { preseasonWinTotal: 81.5, playoffOdds: 155, nextGameMoneyline: 104, teamUrl: "https://www.mlb.com/cardinals" },
  AZ: { preseasonWinTotal: 86.5, playoffOdds: -115, nextGameMoneyline: -118, teamUrl: "https://www.mlb.com/dbacks" },
  COL: { preseasonWinTotal: 60.5, playoffOdds: 2200, nextGameMoneyline: 165, teamUrl: "https://www.mlb.com/rockies" },
  LAD: { preseasonWinTotal: 101.5, playoffOdds: -900, nextGameMoneyline: -185, teamUrl: "https://www.mlb.com/dodgers" },
  SD: { preseasonWinTotal: 85.5, playoffOdds: -105, nextGameMoneyline: -115, teamUrl: "https://www.mlb.com/padres" },
  SF: { preseasonWinTotal: 80.5, playoffOdds: 190, nextGameMoneyline: 110, teamUrl: "https://www.mlb.com/giants" }
};

let cache = {
  payload: null,
  expiresAt: 0
};

function sendJson(res, statusCode, body) {
  res.status(statusCode).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function americanToImpliedProbability(odds) {
  if (!Number.isFinite(odds) || odds === 0) {
    return null;
  }

  if (odds > 0) {
    return 100 / (odds + 100);
  }

  return Math.abs(odds) / (Math.abs(odds) + 100);
}

function average(values) {
  if (!values.length) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildStandingsUrl() {
  const url = new URL(MLB_STANDINGS_URL);
  url.searchParams.set("leagueId", "103,104");
  url.searchParams.set("sportId", "1");
  url.searchParams.set("standingsTypes", "regularSeason");
  return url.toString();
}

async function fetchLiveStandings() {
  const response = await fetch(buildStandingsUrl());

  if (!response.ok) {
    throw new Error(`MLB standings request failed with status ${response.status}.`);
  }

  const payload = await response.json();
  const records = payload.records || [];

  return records.flatMap((divisionRecord) =>
    (divisionRecord.teamRecords || []).map((teamRecord) => {
      const abbreviation = teamRecord.team?.abbreviation;
      const baseline = TEAM_MARKET_BASELINES[abbreviation];

      if (!baseline) {
        return null;
      }

      return {
        team: teamRecord.team?.name || abbreviation,
        symbol: abbreviation,
        teamUrl: baseline.teamUrl,
        league: divisionRecord.league?.name || "",
        division: divisionRecord.division?.nameShort || "",
        wins: Number(teamRecord.wins || 0),
        losses: Number(teamRecord.losses || 0),
        preseasonWinTotal: baseline.preseasonWinTotal,
        playoffOdds: baseline.playoffOdds,
        nextGameMoneyline: baseline.nextGameMoneyline,
        thesis: `${teamRecord.team?.name || abbreviation} are live in the standings, while the market layer remains a modeled baseline until a sportsbook feed is connected.`
      };
    })
  ).filter(Boolean);
}

function buildTeam(team) {
  const gamesPlayed = team.wins + team.losses;
  const actualWinPct = gamesPlayed ? team.wins / gamesPlayed : null;
  const projectedWinPct = team.preseasonWinTotal / GAMES_IN_SEASON;
  const playoffImpliedProbability = americanToImpliedProbability(team.playoffOdds);
  const nextGameImpliedProbability = americanToImpliedProbability(team.nextGameMoneyline);
  const performanceGap = actualWinPct === null ? null : actualWinPct - projectedWinPct;
  const marketGap = playoffImpliedProbability - projectedWinPct;

  let marketRead = "Balanced";
  if ((performanceGap ?? 0) > 0.08 && marketGap < 0) {
    marketRead = "Hot start, market skeptical";
  } else if ((performanceGap ?? 0) < -0.05 && marketGap > 0.04) {
    marketRead = "Cold start, market forgiving";
  } else if ((nextGameImpliedProbability ?? 0) > 0.58) {
    marketRead = "Priced like a nightly favorite";
  } else if ((nextGameImpliedProbability ?? 0) < 0.45) {
    marketRead = "Priced like a nightly underdog";
  }

  return {
    ...team,
    record: `${team.wins}-${team.losses}`,
    actualWinPct,
    projectedWinPct,
    playoffImpliedProbability,
    nextGameImpliedProbability,
    performanceGap,
    marketGap,
    marketRead
  };
}

function summarize(teams) {
  const actualValues = teams.map((team) => team.actualWinPct).filter((value) => value !== null);
  const projectedValues = teams.map((team) => team.projectedWinPct);
  const playoffValues = teams.map((team) => team.playoffImpliedProbability);
  const nextGameValues = teams.map((team) => team.nextGameImpliedProbability);
  const skepticalStarts = teams.filter(
    (team) => (team.performanceGap ?? 0) > 0.08 && (team.marketGap ?? 0) < 0
  ).length;

  let headline = "Live MLB standings are now driving the team records on this board.";
  let takeaway = "The betting layer is still a model, so records are live while odds remain baseline estimates.";

  if (skepticalStarts > 0) {
    takeaway =
      "Some teams are outperforming their preseason baseline, which is exactly where betting apps tend to price cautiously.";
  }

  return {
    headline,
    takeaway,
    averages: {
      actualWinPct: average(actualValues),
      projectedWinPct: average(projectedValues),
      playoffImpliedProbability: average(playoffValues),
      nextGameImpliedProbability: average(nextGameValues)
    }
  };
}

function buildInsights(teams) {
  const hottestStart = [...teams].sort((left, right) => (right.actualWinPct ?? 0) - (left.actualWinPct ?? 0))[0];
  const strongestFavorite = [...teams].sort(
    (left, right) => (right.playoffImpliedProbability ?? 0) - (left.playoffImpliedProbability ?? 0)
  )[0];
  const biggestSkepticism = [...teams].sort((left, right) => (left.marketGap ?? 0) - (right.marketGap ?? 0))[0];
  const biggestLongshot = [...teams].sort(
    (left, right) => (left.playoffImpliedProbability ?? 1) - (right.playoffImpliedProbability ?? 1)
  )[0];

  return [
    {
      label: "Best live record",
      team: hottestStart.team,
      symbol: hottestStart.symbol,
      value: `${hottestStart.record} | ${Math.round((hottestStart.actualWinPct ?? 0) * 100)}% win rate`,
      note: "Pulled from live MLB standings."
    },
    {
      label: "Strongest market trust",
      team: strongestFavorite.team,
      symbol: strongestFavorite.symbol,
      value: `${Math.round((strongestFavorite.playoffImpliedProbability ?? 0) * 100)}% playoff implied`,
      note: "Still based on the current model baseline, not a live sportsbook feed."
    },
    {
      label: "Biggest market skepticism",
      team: biggestSkepticism.team,
      symbol: biggestSkepticism.symbol,
      value: `${((biggestSkepticism.marketGap ?? 0) * 100).toFixed(1)} pts vs projection`,
      note: "Useful for spotting teams whose record is outrunning their expected season strength."
    },
    {
      label: "Deepest longshot",
      team: biggestLongshot.team,
      symbol: biggestLongshot.symbol,
      value: `${Math.round((biggestLongshot.playoffImpliedProbability ?? 0) * 100)}% playoff implied`,
      note: "Also model-based until we connect a sportsbook source."
    }
  ];
}

async function buildPayload() {
  const liveTeams = await fetchLiveStandings();
  const teams = liveTeams
    .map(buildTeam)
    .sort((left, right) => (right.playoffImpliedProbability ?? 0) - (left.playoffImpliedProbability ?? 0));
  const summary = summarize(teams);

  return {
    fetchedAt: new Date().toISOString(),
    source: {
      name: "Live MLB standings + modeled market layer",
      standingsUrl: buildStandingsUrl(),
      note: "Records come from MLB Stats API. Preseason win totals and odds remain local baselines until a live odds feed is connected."
    },
    formulaGuide: [
      "Actual win% = live MLB wins / games played",
      "Projected win% = preseason win total / 162",
      "Implied probability from negative odds = abs(odds) / (abs(odds) + 100)",
      "Implied probability from positive odds = 100 / (odds + 100)"
    ],
    insights: buildInsights(teams),
    summary,
    groups: {
      contenders: teams.filter((team) => team.playoffImpliedProbability >= 0.65),
      skepticalStarts: teams.filter(
        (team) => (team.performanceGap ?? 0) > 0.08 && (team.marketGap ?? 0) < 0
      ),
      longshots: teams.filter((team) => team.playoffImpliedProbability < 0.3)
    },
    scoreboard: teams
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    if (cache.payload && Date.now() < cache.expiresAt) {
      return sendJson(res, 200, cache.payload);
    }

    const payload = await buildPayload();
    cache = {
      payload,
      expiresAt: Date.now() + CACHE_TTL_MS
    };

    return sendJson(res, 200, payload);
  } catch (error) {
    return sendJson(res, 500, {
      error: error.message || "Unable to load MLB betting data."
    });
  }
};
