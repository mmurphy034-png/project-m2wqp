const CACHE_TTL_MS = 5 * 60 * 1000;
const GAMES_IN_SEASON = 162;

const TEAMS = [
  { team: "Baltimore Orioles", symbol: "BAL", teamUrl: "https://www.mlb.com/orioles", league: "AL", division: "East", wins: 4, losses: 3, preseasonWinTotal: 87.5, playoffOdds: -105, nextGameMoneyline: -112, thesis: "The market sees a solid contender, but not one driven by a single week of results." },
  { team: "Boston Red Sox", symbol: "BOS", teamUrl: "https://www.mlb.com/redsox", league: "AL", division: "East", wins: 3, losses: 4, preseasonWinTotal: 81.5, playoffOdds: 145, nextGameMoneyline: 102, thesis: "Near-.500 expectations keep the app close to coin-flip pricing." },
  { team: "New York Yankees", symbol: "NYY", teamUrl: "https://www.mlb.com/yankees", league: "AL", division: "East", wins: 5, losses: 2, preseasonWinTotal: 90.5, playoffOdds: -325, nextGameMoneyline: -145, thesis: "The market respects the underlying roster more than the tiny current sample." },
  { team: "Tampa Bay Rays", symbol: "TB", teamUrl: "https://www.mlb.com/rays", league: "AL", division: "East", wins: 3, losses: 4, preseasonWinTotal: 79.5, playoffOdds: 180, nextGameMoneyline: 108, thesis: "Books keep Tampa in the mix, but without pricing them like a top-tier favorite." },
  { team: "Toronto Blue Jays", symbol: "TOR", teamUrl: "https://www.mlb.com/bluejays", league: "AL", division: "East", wins: 4, losses: 3, preseasonWinTotal: 86.5, playoffOdds: -115, nextGameMoneyline: -118, thesis: "Projection and current record are close enough that prices feel stable." },
  { team: "Chicago White Sox", symbol: "CWS", teamUrl: "https://www.mlb.com/whitesox", league: "AL", division: "Central", wins: 2, losses: 5, preseasonWinTotal: 62.5, playoffOdds: 1600, nextGameMoneyline: 150, thesis: "Weak season expectations keep both futures and daily prices skeptical." },
  { team: "Cleveland Guardians", symbol: "CLE", teamUrl: "https://www.mlb.com/guardians", league: "AL", division: "Central", wins: 4, losses: 2, preseasonWinTotal: 84.5, playoffOdds: -120, nextGameMoneyline: -122, thesis: "A clean early record helps, but the market still leans on broader projection." },
  { team: "Detroit Tigers", symbol: "DET", teamUrl: "https://www.mlb.com/tigers", league: "AL", division: "Central", wins: 5, losses: 2, preseasonWinTotal: 83.5, playoffOdds: -110, nextGameMoneyline: -118, thesis: "A strong start matters, but not enough to override middling divisional uncertainty." },
  { team: "Kansas City Royals", symbol: "KC", teamUrl: "https://www.mlb.com/royals", league: "AL", division: "Central", wins: 3, losses: 4, preseasonWinTotal: 82.5, playoffOdds: 130, nextGameMoneyline: 102, thesis: "The market keeps Kansas City near the playoff bubble rather than fading them hard." },
  { team: "Minnesota Twins", symbol: "MIN", teamUrl: "https://www.mlb.com/twins", league: "AL", division: "Central", wins: 3, losses: 3, preseasonWinTotal: 84.5, playoffOdds: 115, nextGameMoneyline: -104, thesis: "Balanced record and balanced pricing make them a useful middle-of-board case." },
  { team: "Houston Astros", symbol: "HOU", teamUrl: "https://www.mlb.com/astros", league: "AL", division: "West", wins: 4, losses: 3, preseasonWinTotal: 88.5, playoffOdds: -140, nextGameMoneyline: -126, thesis: "Books still trust the franchise baseline even when the first few games are ordinary." },
  { team: "Los Angeles Angels", symbol: "LAA", teamUrl: "https://www.mlb.com/angels", league: "AL", division: "West", wins: 3, losses: 4, preseasonWinTotal: 73.5, playoffOdds: 475, nextGameMoneyline: 125, thesis: "A below-average season projection caps how far one hot or cold patch can move the price." },
  { team: "Athletics", symbol: "ATH", teamUrl: "https://www.mlb.com/athletics", league: "AL", division: "West", wins: 2, losses: 5, preseasonWinTotal: 69.5, playoffOdds: 900, nextGameMoneyline: 138, thesis: "The market still treats them as an underdog profile most nights." },
  { team: "Seattle Mariners", symbol: "SEA", teamUrl: "https://www.mlb.com/mariners", league: "AL", division: "West", wins: 4, losses: 3, preseasonWinTotal: 85.5, playoffOdds: -105, nextGameMoneyline: -118, thesis: "This is close to a fair middle case where record and market expectation nearly agree." },
  { team: "Texas Rangers", symbol: "TEX", teamUrl: "https://www.mlb.com/rangers", league: "AL", division: "West", wins: 3, losses: 4, preseasonWinTotal: 84.5, playoffOdds: 120, nextGameMoneyline: -102, thesis: "The app prices Texas as competitive even without a fast start." },
  { team: "Atlanta Braves", symbol: "ATL", teamUrl: "https://www.mlb.com/braves", league: "NL", division: "East", wins: 3, losses: 4, preseasonWinTotal: 93.5, playoffOdds: -275, nextGameMoneyline: -155, thesis: "A slow week does not erase the projection, so sportsbooks stay aggressive." },
  { team: "Miami Marlins", symbol: "MIA", teamUrl: "https://www.mlb.com/marlins", league: "NL", division: "East", wins: 4, losses: 2, preseasonWinTotal: 72.5, playoffOdds: 500, nextGameMoneyline: 120, thesis: "A strong first week lifts attention, but the market still prices them as a longshot." },
  { team: "New York Mets", symbol: "NYM", teamUrl: "https://www.mlb.com/mets", league: "NL", division: "East", wins: 4, losses: 3, preseasonWinTotal: 88.5, playoffOdds: -135, nextGameMoneyline: -124, thesis: "The market pays more attention to roster quality than to one series swing." },
  { team: "Philadelphia Phillies", symbol: "PHI", teamUrl: "https://www.mlb.com/phillies", league: "NL", division: "East", wins: 5, losses: 2, preseasonWinTotal: 91.5, playoffOdds: -240, nextGameMoneyline: -148, thesis: "A quality roster plus a good start creates one of the cleaner favorite profiles." },
  { team: "Washington Nationals", symbol: "WSH", teamUrl: "https://www.mlb.com/nationals", league: "NL", division: "East", wins: 2, losses: 5, preseasonWinTotal: 70.5, playoffOdds: 1100, nextGameMoneyline: 142, thesis: "Low expectations make the market slow to buy into any short-term optimism." },
  { team: "Chicago Cubs", symbol: "CHC", teamUrl: "https://www.mlb.com/cubs", league: "NL", division: "Central", wins: 4, losses: 3, preseasonWinTotal: 86.5, playoffOdds: -110, nextGameMoneyline: -118, thesis: "A solid projection and manageable division path keep prices supportive." },
  { team: "Cincinnati Reds", symbol: "CIN", teamUrl: "https://www.mlb.com/reds", league: "NL", division: "Central", wins: 4, losses: 3, preseasonWinTotal: 79.5, playoffOdds: 165, nextGameMoneyline: 104, thesis: "The market treats them as live but not yet proven over the long run." },
  { team: "Milwaukee Brewers", symbol: "MIL", teamUrl: "https://www.mlb.com/brewers", league: "NL", division: "Central", wins: 5, losses: 2, preseasonWinTotal: 82.5, playoffOdds: 105, nextGameMoneyline: -108, thesis: "A strong start helps, but books still leave room for regression." },
  { team: "Pittsburgh Pirates", symbol: "PIT", teamUrl: "https://www.mlb.com/pirates", league: "NL", division: "Central", wins: 3, losses: 4, preseasonWinTotal: 76.5, playoffOdds: 260, nextGameMoneyline: 112, thesis: "Prices suggest a competitive underdog rather than a serious division favorite." },
  { team: "St. Louis Cardinals", symbol: "STL", teamUrl: "https://www.mlb.com/cardinals", league: "NL", division: "Central", wins: 3, losses: 4, preseasonWinTotal: 81.5, playoffOdds: 155, nextGameMoneyline: 104, thesis: "The market stays cautious until the record and talent case line up more clearly." },
  { team: "Arizona Diamondbacks", symbol: "AZ", teamUrl: "https://www.mlb.com/dbacks", league: "NL", division: "West", wins: 4, losses: 3, preseasonWinTotal: 86.5, playoffOdds: -115, nextGameMoneyline: -118, thesis: "A credible contender profile means apps do not need an extreme sample to trust them." },
  { team: "Colorado Rockies", symbol: "COL", teamUrl: "https://www.mlb.com/rockies", league: "NL", division: "West", wins: 2, losses: 5, preseasonWinTotal: 60.5, playoffOdds: 2200, nextGameMoneyline: 165, thesis: "One of the clearest examples of a team the market prices as a deep longshot." },
  { team: "Los Angeles Dodgers", symbol: "LAD", teamUrl: "https://www.mlb.com/dodgers", league: "NL", division: "West", wins: 6, losses: 1, preseasonWinTotal: 101.5, playoffOdds: -900, nextGameMoneyline: -185, thesis: "Elite roster depth keeps the market above even a hot early-season record." },
  { team: "San Diego Padres", symbol: "SD", teamUrl: "https://www.mlb.com/padres", league: "NL", division: "West", wins: 4, losses: 3, preseasonWinTotal: 85.5, playoffOdds: -105, nextGameMoneyline: -115, thesis: "Books keep San Diego in the contender class without pushing them to the very top." },
  { team: "San Francisco Giants", symbol: "SF", teamUrl: "https://www.mlb.com/giants", league: "NL", division: "West", wins: 3, losses: 4, preseasonWinTotal: 80.5, playoffOdds: 190, nextGameMoneyline: 110, thesis: "The market sees them as playable but still chasing stronger clubs in the division." }
];

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

  const overperformers = teams.filter((team) => (team.performanceGap ?? 0) > 0.08).length;
  const skepticalStarts = teams.filter(
    (team) => (team.performanceGap ?? 0) > 0.08 && (team.marketGap ?? 0) < 0
  ).length;

  let headline = "Sportsbooks treat MLB win percentage as context, not as the final price.";
  let takeaway = "Preseason strength and game-specific matchup details still dominate most odds.";

  if (skepticalStarts > 0) {
    takeaway =
      "Several fast starters still trade below their current win rate because betting apps fade tiny samples.";
  } else if (overperformers === 0) {
    takeaway =
      "This board is mostly aligned, showing how quickly market expectations can stabilize around consensus teams.";
  }

  return {
    headline,
    takeaway,
    averages: {
      actualWinPct: average(actualValues),
      projectedWinPct: average(projectedValues),
      playoffImpliedProbability: average(playoffValues),
      nextGameImpliedProbability: average(nextGameValues)
    },
    counts: {
      overperformers,
      skepticalStarts,
      favorites: teams.filter((team) => (team.nextGameImpliedProbability ?? 0) >= 0.55).length
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
      label: "Best early record",
      team: hottestStart.team,
      symbol: hottestStart.symbol,
      value: `${hottestStart.record} | ${Math.round((hottestStart.actualWinPct ?? 0) * 100)}% win rate`,
      note: "Best short-run results in the sample."
    },
    {
      label: "Strongest market trust",
      team: strongestFavorite.team,
      symbol: strongestFavorite.symbol,
      value: `${Math.round((strongestFavorite.playoffImpliedProbability ?? 0) * 100)}% playoff implied`,
      note: "The team books trust most in futures pricing."
    },
    {
      label: "Biggest market skepticism",
      team: biggestSkepticism.team,
      symbol: biggestSkepticism.symbol,
      value: `${((biggestSkepticism.marketGap ?? 0) * 100).toFixed(1)} pts vs projection`,
      note: "A team whose betting price still lags its current buzz."
    },
    {
      label: "Deepest longshot",
      team: biggestLongshot.team,
      symbol: biggestLongshot.symbol,
      value: `${Math.round((biggestLongshot.playoffImpliedProbability ?? 0) * 100)}% playoff implied`,
      note: "The lowest postseason probability on the board."
    }
  ];
}

function buildPayload() {
  const teams = TEAMS.map(buildTeam).sort(
    (left, right) => (right.playoffImpliedProbability ?? 0) - (left.playoffImpliedProbability ?? 0)
  );
  const summary = summarize(teams);

  return {
    fetchedAt: new Date().toISOString(),
    source: {
      name: "Illustrative MLB betting model",
      note: "Sample April 2026 team records paired with preseason win totals and representative American odds."
    },
    formulaGuide: [
      "Actual win% = wins / games played",
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
      forgivingMarket: teams.filter(
        (team) => (team.performanceGap ?? 0) < -0.05 && (team.marketGap ?? 0) > 0.04
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

    const payload = buildPayload();
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
