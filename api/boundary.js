const BOUNDARY_BASE_URL = "https://geo.datav.aliyun.com/areas_v3/bound";

module.exports = async function handler(request, response) {
  if (request.method === "OPTIONS") {
    setCorsHeaders(response);
    response.status(204).end();
    return;
  }

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET, OPTIONS");
    response.status(405).json({ error: "Method not allowed" });
    return;
  }

  const rawCode = Array.isArray(request.query.code)
    ? request.query.code[0]
    : request.query.code;
  const code = String(rawCode || "").trim();
  const rawFull = Array.isArray(request.query.full)
    ? request.query.full[0]
    : request.query.full;
  const full = ["1", "true", "full"].includes(String(rawFull || "").toLowerCase());

  if (!/^\d{6}$/.test(code)) {
    response.status(400).json({ error: "Invalid city code" });
    return;
  }

  try {
    const upstream = await fetch(`${BOUNDARY_BASE_URL}/${code}${full ? "_full" : ""}.json`, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (compatible; ChinaleBoundaryProxy/1.0; +https://chinale.suki.house)",
      },
    });

    if (!upstream.ok) {
      response
        .status(upstream.status)
        .json({ error: `Boundary source returned ${upstream.status}` });
      return;
    }

    const body = await upstream.text();
    setCorsHeaders(response);
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader(
      "Cache-Control",
      "public, s-maxage=31536000, stale-while-revalidate=604800",
    );
    response.status(200).send(body);
  } catch (error) {
    response.status(502).json({
      error: "Boundary source unavailable",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}
