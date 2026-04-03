const TWELVE_DATA_BASE_URL = "https://api.twelvedata.com/quote";

const ASSETS = [
  {
    symbol: "USO",
    label: "United States Oil Fund",
    bucket: "oil",
    thesis: "Liquid ETF proxy for front-month crude exposure."
  },
  {
    symbol: "BNO",
    label: "United States Brent Oil Fund",
    bucket: "oil",
    thesis: "ETF proxy for Brent-linked crude exposure."
  },
  {
    symbol: "XLE",
    label: "Energy Select Sector SPDR",
    bucket: "beneficiaries",
    thesis: "Large-cap U.S. energy sector."
  },
  {
    symbol: "XOP",
    label: "S&P Oil & Gas E&P ETF",
    bucket: "beneficiaries",
    thesis: "Higher-beta exploration and production names."
  },
  {
    symbol: "XOM",
    label: "Exxon Mobil",
    bucket: "beneficiaries",
    thesis: "Integrated oil major."
  },
  {
    symbol: "CVX",
    label: "Chevron",
    bucket: "beneficiaries",
    thesis: "Integrated oil major."
  },
  {
    symbol: "SPY",
    label: "S&P 500 ETF",
    bucket: "broad-market",
    thesis: "Broad U.S. equity benchmark."
  },
  {
    symbol: "QQQ",
    label: "Nasdaq 100 ETF",
    bucket: "broad-market",
    thesis: "Growth-heavy U.S. equities."
  },
  {
    symbol: "DAL",
    label: "Delta Air Lines",
    bucket: "consumers",
    thesis: "Airlines often face fuel-cost pressure when oil rises."
  },
  {
    symbol: "UAL",
    label: "United Airlines",
    bucket: "consumers",
    thesis: "Another fuel-sensitive airline proxy."
  },
  {
    symbol: "FDX",
    label: "FedEx",
    bucket: "consumers",
    thesis: "Transport and fuel-cost sensitivity."
  }
];

function getApiKey() {
  const apiKey = process.env.TWELVE_DATA_API_KEY;

  if (!apiKey) {
    const error = new Error("TWELVE_DATA_API_KEY is not configured.");
    error.statusCode = 500;
    throw error;
  }

  return apiKey;
}

function quoteUrl(symbol) {
  const url = new URL(TWELVE_DATA_BASE_URL);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", "1day");
  url.searchParams.set("apikey", getApiKey());
  return url.toString();
}

function sendJson(res, statusCode, body) {
  res.status(statusCode).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function toNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numeric = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeQuote(rawQuote, asset) {
  return {
    ...asset,
    symbol: rawQuote.symbol || asset.symbol,
    name: rawQuote.name || asset.label,
    last: toNumber(rawQuote.close ?? rawQuote.price),
    change: toNumber(rawQuote.change),
    percentChange: toNumber(rawQuote.percent_change),
    open: toNumber(rawQuote.open),
    high: toNumber(rawQuote.high),
    low: toNumber(rawQuote.low),
    prevClose: toNumber(rawQuote.previous_close),
    volume: toNumber(rawQuote.volume),
    status: rawQuote.is_market_open ? "OPEN" : "CLOSED",
    sourceUrl: `https://twelvedata.com/market-data/${encodeURIComponent(asset.symbol)}`
  };
}

function averagePercent(items) {
  const values = items.map((item) => item.percentChange).filter((value) => value !== null);
  if (!values.length) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sentimentFromChange(value) {
  if (value === null) {
    return "flat";
  }

  if (value > 0.35) {
    return "up";
  }

  if (value < -0.35) {
    return "down";
  }

  return "flat";
}

function summarize(assets) {
  const oil = assets.filter((asset) => asset.bucket === "oil");
  const beneficiaries = assets.filter((asset) => asset.bucket === "beneficiaries");
  const broad = assets.filter((asset) => asset.bucket === "broad-market");
  const consumers = assets.filter((asset) => asset.bucket === "consumers");

  const oilMove = sentimentFromChange(averagePercent(oil));
  const beneficiaryAvg = averagePercent(beneficiaries);
  const consumerAvg = averagePercent(consumers);
  const broadAvg = averagePercent(broad);

  let headline = "Oil and cross-asset signals are mixed.";
  if (oilMove === "up") {
    headline = "Oil-linked ETFs are pushing higher and the dashboard is checking who is keeping up.";
  } else if (oilMove === "down") {
    headline = "Oil-linked ETFs are fading and the dashboard is checking where the pressure is spreading.";
  }

  let takeaway = "Leadership is scattered across the watchlist.";
  if ((beneficiaryAvg ?? 0) > 0 && (consumerAvg ?? 0) < 0) {
    takeaway = "Energy-linked names are outperforming while fuel-sensitive stocks are lagging.";
  } else if ((beneficiaryAvg ?? 0) < 0 && (consumerAvg ?? 0) > 0) {
    takeaway = "Oil-sensitive consumers are catching a break while energy producers are softer.";
  } else if ((broadAvg ?? 0) < 0 && oilMove === "up") {
    takeaway = "Higher oil proxies are coinciding with a weaker broad-market tone.";
  }

  return {
    headline,
    takeaway,
    oilDirection: oilMove,
    averages: {
      oil: averagePercent(oil),
      beneficiaries: beneficiaryAvg,
      consumers: consumerAvg,
      broadMarket: broadAvg
    }
  };
}

function scoreAgainstOil(asset, oilDirection) {
  if (asset.percentChange === null || oilDirection === "flat") {
    return "neutral";
  }

  if (asset.bucket === "beneficiaries") {
    return oilDirection === "up" && asset.percentChange > 0
      ? "tracking"
      : oilDirection === "down" && asset.percentChange < 0
        ? "tracking"
        : "diverging";
  }

  if (asset.bucket === "consumers") {
    return oilDirection === "up" && asset.percentChange < 0
      ? "tracking"
      : oilDirection === "down" && asset.percentChange > 0
        ? "tracking"
        : "diverging";
  }

  return "neutral";
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const quotes = await Promise.all(
      ASSETS.map(async (asset) => {
        const response = await fetch(quoteUrl(asset.symbol));

        if (!response.ok) {
          throw new Error(
            `Twelve Data quote request failed for ${asset.symbol} with status ${response.status}.`
          );
        }

        const text = await response.text();
        let payload;

        try {
          payload = JSON.parse(text);
        } catch (error) {
          throw new Error(
            `Twelve Data returned non-JSON for ${asset.symbol}: ${text.slice(0, 140)}`
          );
        }

        if (payload.status === "error") {
          throw new Error(`${asset.symbol}: ${payload.message || "Twelve Data returned an error."}`);
        }

        return normalizeQuote(payload, asset);
      })
    );

    const scoreboard = quotes.map((asset) => ({
      ...asset,
      oilRelationship: scoreAgainstOil(asset, "flat")
    }));

    const summary = summarize(scoreboard);
    const finalScoreboard = scoreboard.map((asset) => ({
      ...asset,
      oilRelationship: scoreAgainstOil(asset, summary.oilDirection)
    }));

    return sendJson(res, 200, {
      fetchedAt: new Date().toISOString(),
      source: {
        name: "Twelve Data quote API",
        quoteUrl: "https://api.twelvedata.com/quote",
        note: "Quote coverage and timeliness depend on your Twelve Data plan and symbol eligibility."
      },
      summary,
      groups: {
        oil: finalScoreboard.filter((asset) => asset.bucket === "oil"),
        beneficiaries: finalScoreboard.filter((asset) => asset.bucket === "beneficiaries"),
        broadMarket: finalScoreboard.filter((asset) => asset.bucket === "broad-market"),
        consumers: finalScoreboard.filter((asset) => asset.bucket === "consumers")
      },
      scoreboard: finalScoreboard
    });
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      error: error.message || "Unable to load market data."
    });
  }
};
