/* SAHROUD COUNTER shared client v1
 * No GPS. City/country are inferred at the edge from request metadata.
 * Analytics runs only after explicit opt-in.
 */
(function () {
  "use strict";
  const cfg = window.SAHROUD_COUNTER_CONFIG || {};
  const API = String(cfg.apiBase || "").replace(/\/$/, "");
  const APP_ID = String(cfg.appId || "unknown").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 48);
  const APP_NAME = String(cfg.appName || APP_ID).slice(0, 80);
  const CONSENT_KEY = "sahroud_counter_consent_v1";
  const VISITOR_KEY = "sahroud_counter_visitor_v1";
  const SESSION_KEY = "sahroud_counter_session_v1";
  if (!API || !/^https:\/\//i.test(API)) return;

  function id() {
    try {
      let value = localStorage.getItem(VISITOR_KEY);
      if (!value) {
        value = (crypto.randomUUID ? crypto.randomUUID() : "v-" + Date.now() + "-" + Math.random().toString(36).slice(2));
        localStorage.setItem(VISITOR_KEY, value);
      }
      return value;
    } catch (_) { return "session-" + Math.random().toString(36).slice(2); }
  }

  function collect(eventName) {
    const payload = {
      appId: APP_ID,
      appName: APP_NAME,
      event: String(eventName || "app_open").slice(0, 48),
      visitorId: id(),
      version: String(cfg.version || "1").slice(0, 24),
      path: location.pathname.slice(0, 180)
    };
    fetch(API + "/collect", {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: "omit"
    }).catch(function () {});
  }

  function showConsent() {
    if (localStorage.getItem(CONSENT_KEY)) return;
    const wrap = document.createElement("div");
    wrap.dir = "rtl";
    wrap.style.cssText = "position:fixed;z-index:2147483000;inset:auto 12px 12px 12px;max-width:520px;margin:auto;background:#fff;color:#17313b;border:1px solid #d7e2e7;border-radius:14px;box-shadow:0 8px 32px #0003;padding:15px;font:13px/1.9 Tahoma,Arial,sans-serif";
    const title = document.createElement("strong");
    title.textContent = "بهبود نرم‌افزارهای SAHROUD";
    const p = document.createElement("p");
    p.textContent = "در صورت موافقت، آمار ناشناس استفاده از این نرم‌افزار ثبت می‌شود. شهر و کشور فقط از طریق اطلاعات تقریبی اتصال اینترنت تشخیص داده می‌شود؛ GPS و مختصات دقیق دریافت یا ذخیره نمی‌شود. استفاده از نرم‌افزار بدون پذیرش آمارگیری نیز ممکن است.";
    p.style.margin = "7px 0 12px";
    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:8px;flex-wrap:wrap";
    function btn(label, color, action) {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = label;
      b.style.cssText = "border:0;border-radius:9px;padding:10px 14px;background:" + color + ";color:#fff;font: bold 12px Tahoma;cursor:pointer";
      b.addEventListener("click", action);
      return b;
    }
    actions.appendChild(btn("موافقم", "#087e75", function () {
      localStorage.setItem(CONSENT_KEY, "yes"); wrap.remove(); start();
    }));
    actions.appendChild(btn("موافق نیستم", "#647780", function () {
      localStorage.setItem(CONSENT_KEY, "no"); wrap.remove();
    }));
    wrap.append(title, p, actions);
    document.body.appendChild(wrap);
  }

  function start() {
    if (localStorage.getItem(CONSENT_KEY) !== "yes") return;
    const session = sessionStorage.getItem(SESSION_KEY);
    if (!session) {
      sessionStorage.setItem(SESSION_KEY, "1");
      collect("app_open");
    }
  }

  window.SAHROUD_COUNTER = {
    track: function (name) {
      if (localStorage.getItem(CONSENT_KEY) === "yes") collect(name);
    },
    status: function () {
      return { configured: true, consent: localStorage.getItem(CONSENT_KEY) || "pending", appId: APP_ID };
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { showConsent(); start(); }, { once: true });
  } else { showConsent(); start(); }
})();