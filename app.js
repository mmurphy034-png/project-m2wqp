const headline = document.getElementById("headline");
const headlineLinks = document.getElementById("headlineLinks");
const scoreboard = document.getElementById("scoreboard");
const pitchingGrid = document.getElementById("pitchingGrid");

const ESPN_LOGO_CODE = {
  AZ: "ari",
  ATL: "atl",
  BAL: "bal",
  BOS: "bos",
  CHC: "chc",
  CWS: "chw",
  CIN: "cin",
  CLE: "cle",
  COL: "col",
  DET: "det",
  HOU: "hou",
  KC: "kc",
  LAA: "laa",
  LAD: "lad",
  MIA: "mia",
  MIL: "mil",
  MIN: "min",
  NYM: "nym",
  NYY: "nyy",
  ATH: "oak",
  PHI: "phi",
  PIT: "pit",
  SD: "sd",
  SF: "sf",
  SEA: "sea",
  STL: "stl",
  TB: "tb",
  TEX: "tex",
  TOR: "tor",
  WSH: "wsh"
};

function teamLogoUrl(code) {
  if (!code) {
    return "";
  }

  const logoCode = ESPN_LOGO_CODE[code] || String(code).toLowerCase();
  return `https://a.espncdn.com/combiner/i?img=/i/teamlogos/mlb/500/${logoCode}.png&h=48&w=48&scale=crop&location=origin`;
}

function formatPct(value) {
  if (value === null || value === undefined) {
    return "--";
  }

  return `${(Number(value) * 100).toFixed(1)}%`;
}

function formatMoneyline(value) {
  if (value === null || value === undefined) {
    return "--";
  }

  return value > 0 ? `+${value}` : `${value}`;
}

function formatSpread(value) {
  if (value === null || value === undefined) {
    return "--";
  }

  return value > 0 ? `+${value}` : `${value}`;
}

function formatSpreadWithPrice(spread, price) {
  if ((spread === null || spread === undefined) && (price === null || price === undefined)) {
    return "--";
  }

  const spreadText = formatSpread(spread);
  const priceText = formatMoneyline(price);

  if (spreadText === "--") {
    return priceText;
  }

  if (priceText === "--") {
    return spreadText;
  }

  return `${spreadText} (${priceText})`;
}

function handLabel(hand) {
  if (hand === "L") {
    return "LHP";
  }

  if (hand === "R") {
    return "RHP";
  }

  return "--";
}

function formatNumber(value, digits = 2) {
  if (value === null || value === undefined) {
    return "--";
  }

  return Number(value).toFixed(digits);
}

function matchupWinShares(game) {
  const away = game.away.winPct;
  const home = game.home.winPct;

  if (away === null || away === undefined || home === null || home === undefined) {
    return { away: null, home: null };
  }

  const total = away + home;
  if (!total) {
    return { away: null, home: null };
  }

  return {
    away: away / total,
    home: home / total
  };
}

function matchupShareBar(game) {
  const shares = matchupWinShares(game);
  const awayWidth =
    shares.away === null || shares.away === undefined
      ? 0
      : Math.max(0, Math.min(50, shares.away * 100));
  const homeWidth =
    shares.home === null || shares.home === undefined
      ? 0
      : Math.max(0, Math.min(50, shares.home * 100));

  return `
    <div class="matchup-share">
      <div class="matchup-share-labels">
        <span>${game.away.code} ${formatPct(shares.away)}</span>
        <span>${game.home.code} ${formatPct(shares.home)}</span>
      </div>
      <div class="matchup-share-track">
        <span class="matchup-share-fill away" style="width:${awayWidth}%"></span>
        <span class="matchup-share-fill home" style="width:${homeWidth}%"></span>
      </div>
    </div>
  `;
}

function renderPitchingCard(game) {
  const gameState = game.gameStatus || "Scheduled";
  const scoreText =
    gameState === "Scheduled" || gameState === "Pre-Game"
      ? "0-0"
      : `${game.awayScore}-${game.homeScore}`;

  return `
    <article class="matchup-card">
      <div class="matchup-top">
        <div>
          <h3>${game.matchup}</h3>
          <p class="eyebrow">${game.lean}</p>
        </div>
        <div class="pill neutral">${scoreText} ${gameState}</div>
      </div>
      <div class="matchup-columns">
        <div class="matchup-team">
          <div class="team-heading">
            <img class="team-logo" src="${teamLogoUrl(game.away.code)}" alt="${game.away.code} logo" />
            <strong>${game.away.code}</strong>
          </div>
          <span>${game.away.pitcher.name}</span>
          <span>${handLabel(game.away.pitcher.hand)} | ERA ${formatNumber(game.away.pitcher.era)} | WHIP ${formatNumber(game.away.pitcher.whip)}</span>
          <span>Record ${game.away.record || "--"} | Win% ${formatPct(game.away.winPct)}</span>
          <span>Run line ${formatSpreadWithPrice(game.away.medianSpread, game.away.medianSpreadPrice)}</span>
          <span>Bullpen ${game.away.bullpen.state} (${formatNumber(game.away.bullpen.innings, 1)} IP yesterday)</span>
        </div>
        <div class="matchup-meta">
          <span>Starter edge: ${game.starterEdge}</span>
          <span>Bullpen edge: ${game.bullpenEdge}</span>
          <span>Market lean: ${game.lean}</span>
        </div>
        <div class="matchup-team">
          <div class="team-heading">
            <img class="team-logo" src="${teamLogoUrl(game.home.code)}" alt="${game.home.code} logo" />
            <strong>${game.home.code}</strong>
          </div>
          <span>${game.home.pitcher.name}</span>
          <span>${handLabel(game.home.pitcher.hand)} | ERA ${formatNumber(game.home.pitcher.era)} | WHIP ${formatNumber(game.home.pitcher.whip)}</span>
          <span>Record ${game.home.record || "--"} | Win% ${formatPct(game.home.winPct)}</span>
          <span>Run line ${formatSpreadWithPrice(game.home.medianSpread, game.home.medianSpreadPrice)}</span>
          <span>Bullpen ${game.home.bullpen.state} (${formatNumber(game.home.bullpen.innings, 1)} IP yesterday)</span>
        </div>
      </div>
    </article>
  `;
}

function renderScoreboard(items) {
  scoreboard.innerHTML = `
    <div class="matrix-head">
      <span>Game</span>
      <span>Live</span>
      <span>Win share</span>
      <span>Away line</span>
      <span>Home line</span>
      <span>Lean</span>
    </div>
    ${items
      .map(
        (game) => `
          <article class="matrix-row matrix-row-simple">
            <div class="team-cell">
              <strong class="game-title">
                <img class="team-logo small" src="${teamLogoUrl(game.away.code)}" alt="${game.away.code} logo" />
                <span>${game.matchup}</span>
                <img class="team-logo small" src="${teamLogoUrl(game.home.code)}" alt="${game.home.code} logo" />
              </strong>
              <p>${game.away.code} ${game.away.record || "--"} | ${game.home.code} ${game.home.record || "--"}</p>
            </div>
            <div class="live-cell">
              <strong>${game.gameStatus === "Scheduled" || game.gameStatus === "Pre-Game" ? "0-0" : `${game.awayScore}-${game.homeScore}`}</strong>
              <p>${game.gameStatus || "Scheduled"}</p>
            </div>
            <div>${matchupShareBar(game)}</div>
            <div class="line-cell">${formatSpreadWithPrice(game.away.medianSpread, game.away.medianSpreadPrice)}</div>
            <div class="line-cell">${formatSpreadWithPrice(game.home.medianSpread, game.home.medianSpreadPrice)}</div>
            <div><span class="relationship ${game.lean.includes("edge") ? "positive" : "neutral"}">${game.lean}</span></div>
          </article>
        `
      )
      .join("")}
  `;
}

function renderHeadlines(items) {
  if (!items.length) {
    headlineLinks.innerHTML = `<div class="empty-state">No headlines available right now.</div>`;
    return;
  }

  headlineLinks.innerHTML = items
    .map(
      (item) => `
        <a class="headline-link" href="${item.link}" target="_blank" rel="noreferrer">
          <span>${item.title}</span>
        </a>
      `
    )
    .join("");
}

function renderDashboard(payload) {
  headline.textContent = `MLB ${String.fromCodePoint(0x26be)}`;
  renderScoreboard(payload.matchups || []);
  pitchingGrid.innerHTML = (payload.matchups || []).length
    ? (payload.matchups || []).map(renderPitchingCard).join("")
    : `<div class="empty-state">No pitching matchups found for today.</div>`;
}

function renderError(message) {
  headline.textContent = `MLB ${String.fromCodePoint(0x26be)}`;
  scoreboard.innerHTML = `<div class="empty-state">${message}</div>`;
  pitchingGrid.innerHTML = "";
}

async function loadDashboard() {
  try {
    const [marketResponse, headlinesResponse] = await Promise.all([
      fetch("/api/market-data"),
      fetch("/api/headlines")
    ]);
    const payload = await marketResponse.json();
    const headlinesPayload = await headlinesResponse.json();

    if (!marketResponse.ok) {
      throw new Error(payload.error || "Unable to fetch MLB market data.");
    }

    renderHeadlines(headlinesResponse.ok ? headlinesPayload.headlines || [] : []);
    renderDashboard(payload);
  } catch (error) {
    renderError(error.message);
  }
}

loadDashboard();
