/**
 * SAHROUD COUNTER API — Cloudflare Worker + D1
 * Required bindings: DB (D1), ADMIN_TOKEN (secret), HASH_SECRET (secret).
 * Deploy this Worker separately; GitHub Pages cannot securely receive/store analytics.
 */
const ALLOWED_ORIGINS = new Set(["https://sahroud.github.io"]);
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

function response(data, status = 200, origin = "") {
  const headers = { ...JSON_HEADERS, "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type,authorization" };
  if (ALLOWED_ORIGINS.has(origin)) headers["access-control-allow-origin"] = origin;
  return new Response(JSON.stringify(data), { status, headers });
}
function safeText(v, max, fallback = "") {
  return String(v ?? fallback).replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
}
async function hmac(value, secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(sig), b => b.toString(16).padStart(2, "0")).join("");
}
function authorized(request, env) {
  const token = request.headers.get("authorization") || "";
  return !!env.ADMIN_TOKEN && token === "Bearer " + env.ADMIN_TOKEN;
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("origin") || "";
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: {
      "access-control-allow-origin": ALLOWED_ORIGINS.has(origin) ? origin : "null",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization",
      "access-control-max-age": "86400"
    }});
    if (url.pathname === "/health" && request.method === "GET") return response({ ok: true, service: "SAHROUD COUNTER", version: "1.0.0" }, 200, origin);

    if (url.pathname === "/collect" && request.method === "POST") {
      if (origin && !ALLOWED_ORIGINS.has(origin)) return response({ error: "origin_not_allowed" }, 403, origin);
      let body;
      try { body = await request.json(); } catch (_) { return response({ error: "invalid_json" }, 400, origin); }
      const appId = safeText(body.appId, 48).toLowerCase();
      const visitorId = safeText(body.visitorId, 120);
      if (!/^[a-z0-9_-]{2,48}$/.test(appId) || visitorId.length < 8) return response({ error: "invalid_payload" }, 400, origin);
      if (!env.HASH_SECRET) return response({ error: "server_not_configured" }, 503, origin);
      const visitorHash = await hmac(visitorId, env.HASH_SECRET);
      const cf = request.cf || {};
      const city = safeText(cf.city, 100) || null;
      const country = safeText(cf.country, 2).toUpperCase() || null;
      await env.DB.prepare(
        "INSERT INTO events (app_id, app_name, event_name, visitor_hash, city, country, version, page_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(
        appId, safeText(body.appName, 80, appId), safeText(body.event, 48, "app_open"),
        visitorHash, city, country, safeText(body.version, 24, "1"), safeText(body.path, 180)
      ).run();
      return response({ ok: true }, 202, origin);
    }

    if (url.pathname === "/stats" && request.method === "GET") {
      if (!authorized(request, env)) return response({ error: "unauthorized" }, 401, origin);
      const days = Math.max(1, Math.min(365, Number(url.searchParams.get("days")) || 30));
      const since = new Date(Date.now() - days * 86400000).toISOString();
      const [totals, apps, cities, daily] = await Promise.all([
        env.DB.prepare("SELECT COUNT(*) AS events, COUNT(DISTINCT visitor_hash) AS visitors FROM events WHERE created_at >= ?").bind(since).first(),
        env.DB.prepare("SELECT app_id, MAX(app_name) AS app_name, COUNT(*) AS events, COUNT(DISTINCT visitor_hash) AS visitors FROM events WHERE created_at >= ? GROUP BY app_id ORDER BY events DESC").bind(since).all(),
        env.DB.prepare("SELECT COALESCE(city,'نامشخص') AS city, COALESCE(country,'--') AS country, COUNT(*) AS events, COUNT(DISTINCT visitor_hash) AS visitors FROM events WHERE created_at >= ? GROUP BY city,country ORDER BY events DESC LIMIT 100").bind(since).all(),
        env.DB.prepare("SELECT substr(created_at,1,10) AS day, COUNT(*) AS events, COUNT(DISTINCT visitor_hash) AS visitors FROM events WHERE created_at >= ? GROUP BY day ORDER BY day").bind(since).all()
      ]);
      const [today, month] = await Promise.all([
        env.DB.prepare("SELECT COUNT(*) AS events, COUNT(DISTINCT visitor_hash) AS visitors FROM events WHERE created_at >= ?").bind(new Date(new Date().setUTCHours(0,0,0,0)).toISOString()).first(),
        env.DB.prepare("SELECT COUNT(*) AS events, COUNT(DISTINCT visitor_hash) AS visitors FROM events WHERE created_at >= ?").bind(new Date(Date.now() - 30*86400000).toISOString()).first()
      ]);
      return response({ ok: true, days, totals: totals || {}, today: today || {}, month: month || {}, apps: apps.results || [], cities: cities.results || [], daily: daily.results || [] }, 200, origin);
    }
    return response({ error: "not_found" }, 404, origin);
  }
};