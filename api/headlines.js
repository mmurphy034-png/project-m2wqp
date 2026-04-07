const MLB_NEWS_RSS_URL = "https://www.mlb.com/feeds/news/rss.xml";

function sendJson(res, statusCode, body) {
  res.status(statusCode).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function decodeXml(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractItems(xml) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

  return items.slice(0, 6).map((match) => {
    const itemXml = match[1];
    const title = itemXml.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "";
    const link = itemXml.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || "";
    const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1] || "";

    return {
      title: decodeXml(title).trim(),
      link: decodeXml(link).trim(),
      pubDate: decodeXml(pubDate).trim()
    };
  }).filter((item) => item.title && item.link);
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  try {
    const response = await fetch(MLB_NEWS_RSS_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MLBDashboard/1.0)"
      }
    });

    if (!response.ok) {
      throw new Error(`MLB headlines request failed with status ${response.status}.`);
    }

    const xml = await response.text();
    const headlines = extractItems(xml);

    return sendJson(res, 200, {
      source: MLB_NEWS_RSS_URL,
      headlines
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: error.message || "Unable to load MLB headlines."
    });
  }
};
