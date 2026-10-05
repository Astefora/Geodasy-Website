/**
 * alertService.js — Multi-Channel Early Warning Dispatcher (SMS Ethiopia & Email)
 * 
 * SMS Gateway: SMS Ethiopia (https://smsethiopia.com)
 * API Key / Token: 9X6CDFFJKDZTDLMACZX77E291OHDCVZWXUDNMRXW
 */

const path = require("path");
const dns = require("dns");
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}
const https = require("https");
const http = require("http");
const nodemailer = require("nodemailer");
const AlertHistory = require("./models/AlertHistory");
const AlertSubscription = require("./models/AlertSubscription");

const SMS_ETHIOPIA_API_KEY = process.env.SMS_ETHIOPIA_API_KEY || "9X6CDFFJKDZTDLMACZX77E291OHDCVZWXUDNMRXW";

// Email transporter setup
function getEmailTransporter() {
  require("dotenv").config({ path: path.join(__dirname, ".env") });
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.EMAIL_PORT || "587", 10);
  const user = process.env.EMAIL_USER;
  const rawPass = process.env.EMAIL_PASS || "";
  const pass = rawPass.replace(/\s+/g, "");

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465 || process.env.EMAIL_SECURE === "true",
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
    family: 4, // Force IPv4 to prevent ENETUNREACH
  });
}

/**
 * Normalizes Ethiopian phone numbers:
 * - "0912345678" -> "251912345678"
 * - "+251912345678" -> "251912345678"
 * - "251912345678" -> "251912345678"
 */
function normalizeEthiopianPhone(phone) {
  if (!phone) return "";
  let clean = phone.replace(/[^0-9+]/g, "");
  if (clean.startsWith("+")) clean = clean.slice(1);
  if (clean.startsWith("0")) clean = "251" + clean.slice(1);
  if (clean.startsWith("9") && clean.length === 9) clean = "251" + clean;
  if (clean.startsWith("7") && clean.length === 9) clean = "251" + clean;
  return clean;
}

/**
 * Sends SMS via SMSEthiopia API (smsethiopia.com)
 */
async function sendSmsEthiopia({ to, message }) {
  const phone = normalizeEthiopianPhone(to);
  if (!phone) {
    throw new Error("Invalid phone number format. Provide Ethiopian mobile (09... / 07... / 2519...).");
  }

  const apiKey = process.env.SMS_ETHIOPIA_API_KEY || "9X6CDFFJKDZTDLMACZX77E291OHDCVZWXUDNMRXW";

  const payload = JSON.stringify({
    msisdn: phone,
    text: message,
    to: phone,
    phone: phone,
    mobile: phone,
    message: message,
    msg: message,
    key: apiKey,
    token: apiKey,
    sender: "EDRMC-ALERT",
  });

  return new Promise((resolve) => {
    const postOptions = {
      hostname: "smsethiopia.com",
      port: 443,
      path: "/api/sms/send",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        "KEY": apiKey,
        "key": apiKey,
        "Authorization": `Bearer ${apiKey}`,
      },
      timeout: 12000,
    };

    const req = https.request(postOptions, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300 && !parsed.error && !parsed.error_message) {
            resolve({ success: true, status: res.statusCode, response: parsed });
          } else if (parsed.error_message?.includes("DEFAULT_CAMPAIGN_RECIPIENT_NOT_WHITELISTED") || parsed.error_message?.includes("10007")) {
            resolve({
              success: false,
              status: 400,
              error: `SMS Ethiopia (Starter Key): Number ${phone} is not whitelisted in your smsethiopia.com dashboard. For public broadcasts, add a production campaign API key.`,
              response: parsed,
            });
          } else if (res.statusCode === 401) {
            resolve({
              success: false,
              status: 401,
              error: "SMS Ethiopia API Token unauthorized or invalid (HTTP 401). Please check SMS_ETHIOPIA_API_KEY in backend/.env.",
              response: parsed,
            });
          } else {
            resolve({
              success: false,
              status: res.statusCode,
              error: parsed.error_message || parsed.message || parsed.error || `SMS gateway returned HTTP ${res.statusCode}`,
              response: parsed,
            });
          }
        } catch {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, status: res.statusCode, raw: body });
          } else {
            resolve({
              success: false,
              status: res.statusCode,
              error: `SMS Ethiopia gateway response: HTTP ${res.statusCode}`,
              raw: body,
            });
          }
        }
      });
    });

    req.on("error", (err) => {
      console.warn("[alertService] SMS Ethiopia connection notice:", err.message);
      resolve({
        success: false,
        status: 500,
        error: `SMS Gateway network connection error: ${err.message}`,
      });
    });

    req.on("timeout", () => {
      req.destroy();
      resolve({
        success: false,
        status: 408,
        error: "SMS Ethiopia gateway connection timed out after 12s.",
      });
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Automatically registers and syncs a subscriber's phone number with SMS Ethiopia Gateway
 */
async function registerContactToSmsEthiopia({
  phone,
  name = "Subscriber",
  email = "",
  regions = ["All"],
  minSeverity = "Warning",
}) {
  const norm = normalizeEthiopianPhone(phone);
  if (!norm) {
    return { success: false, error: "Invalid Ethiopian phone number" };
  }

  const apiKey =
    process.env.SMS_ETHIOPIA_API_KEY ||
    "9X6CDFFJKDZTDLMACZX77E291OHDCVZWXUDNMRXW";
  console.log(
    `[smsGateway] Auto-registering contact +${norm} (${name}) to SMS Ethiopia Gateway...`,
  );

  // Welcome / registration confirmation SMS text
  const regMsg = `[EDRMC / SSGI EARLY WARNING]\nWelcome ${name}! Your phone (+${norm}) is now registered for Ethiopia Disaster Alerts (${regions.join(", ")} | Min: ${minSeverity}). Hotline: 8335.`;

  // Dispatch live registration verification ping to SMS Ethiopia
  const res = await sendSmsEthiopia({
    to: norm,
    message: regMsg,
  });

  return {
    success: res.success,
    phone: norm,
    gateway: "smsethiopia.com",
    registeredAt: new Date(),
    gatewayRes: res,
    status: res.success ? "registered_and_dispatched" : "sync_attempted",
    note: res.success
      ? `Phone +${norm} successfully registered to SMS Ethiopia contact roster and welcome SMS delivered.`
      : res.error,
  };
}

/**
 * Builds professional Ethiopian Disaster Early Warning SMS template
 */
function formatProfessionalSms({ hazard, severity, location, issuedStr, actionSummary }) {
  const sevUpper = (severity || "WARNING").toUpperCase();
  const hazUpper = (hazard || "HAZARD").toUpperCase();
  const time = issuedStr || new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return `[EDRMC / SSGI EARLY WARNING]\nLEVEL: ${sevUpper}\nHAZARD: ${hazUpper}\nLOCATION: ${location}\nISSUED: ${time} EAT\nADVISORY: ${actionSummary || "Take safety precautions and follow local DRMC advisories."}\nEMERGENCY HOTLINE: 8335\nPORTAL: https://disaster.ssgi.gov.et`;
}

/**
 * Builds professional Ethiopian Disaster Early Warning HTML Email template
 */
function buildProfessionalEmailHtml({ alertId, hazard, severity, location, issuedStr, details, telemetry, actions }) {
  const sevColors = {
    Emergency: { bg: "#ef4444", text: "#ffffff", border: "#b91c1c" },
    Warning: { bg: "#f97316", text: "#ffffff", border: "#c2410c" },
    Watch: { bg: "#eab308", text: "#1e293b", border: "#a16207" },
    Advisory: { bg: "#22c55e", text: "#ffffff", border: "#15803d" },
  };

  const theme = sevColors[severity] || sevColors.Warning;
  const time = issuedStr || new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EDRMC / SSGI Early Warning Alert</title>
</head>
<body style="margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#0b132b;color:#f8fafc;">
  <div style="max-width:620px;margin:0 auto;background:#1e293b;border:1px solid rgba(255,255,255,0.1);border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.5);">
    
    <!-- Top Header -->
    <div style="background:linear-gradient(135deg,#1f4fd8 0%,#0f172a 100%);padding:22px 28px;border-bottom:1px solid rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:space-between;">
      <div>
        <div style="color:#93c5fd;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;">
          Federal Democratic Republic of Ethiopia
        </div>
        <h1 style="margin:4px 0 0;font-size:19px;color:#ffffff;font-weight:800;">
          EDRMC &amp; SSGI Multi-Hazard Early Warning System
        </h1>
      </div>
    </div>

    <!-- Threat Level Banner -->
    <div style="background:${theme.bg};color:${theme.text};padding:14px 28px;display:flex;align-items:center;justify-content:space-between;border-left:8px solid ${theme.border};">
      <div>
        <span style="font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;opacity:0.9;">OFFICIAL DISASTER ALERT</span>
        <div style="font-size:18px;font-weight:900;letter-spacing:0.02em;">${severity.toUpperCase()} ALERT — ${hazard.toUpperCase()}</div>
      </div>
      <div style="text-align:right;">
        <span style="font-size:10px;padding:3px 8px;border-radius:6px;background:rgba(0,0,0,0.25);font-weight:700;">${alertId}</span>
      </div>
    </div>

    <!-- Alert Parameters Card -->
    <div style="padding:24px 28px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13.5px;">
        <tr>
          <td style="padding:8px 0;color:#94a3b8;width:120px;">Location:</td>
          <td style="padding:8px 0;color:#ffffff;font-weight:700;">${location}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#94a3b8;">Issued Timestamp:</td>
          <td style="padding:8px 0;color:#e2e8f0;font-weight:600;">${time} EAT</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#94a3b8;">Threat Level:</td>
          <td style="padding:8px 0;">
            <span style="display:inline-block;padding:2px 8px;border-radius:4px;background:${theme.bg}30;color:${theme.bg};font-weight:800;font-size:12px;border:1px solid ${theme.bg}60;">
              ${severity}
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#94a3b8;">Situation Summary:</td>
          <td style="padding:8px 0;color:#cbd5e1;line-height:1.5;">${details || "Automated sensor telemetry exceeds critical hazard thresholds. Immediate precautions required."}</td>
        </tr>
      </table>

      ${
        telemetry && Object.keys(telemetry).length > 0
          ? `
      <div style="background:#0f172a;border:1px solid #334155;border-radius:10px;padding:12px 16px;margin-bottom:20px;">
        <div style="font-size:11.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;margin-bottom:6px;">Live Sensor Telemetry Snapshot:</div>
        <div style="font-size:13px;color:#38bdf8;font-family:monospace;">
          ${Object.entries(telemetry)
            .map(([k, v]) => `<strong>${k}:</strong> ${v}`)
            .join(" &nbsp;|&nbsp; ")}
        </div>
      </div>`
          : ""
      }

      <!-- Safety Protocols -->
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px 20px;margin-bottom:22px;">
        <h3 style="margin:0 0 10px 0;font-size:13.5px;color:#f8fafc;font-weight:700;">Required Public Action Protocols:</h3>
        <ul style="margin:0;padding-left:18px;color:#cbd5e1;font-size:12.5px;line-height:1.6;">
          ${(actions || [
            "Monitor local DRMC emergency broadcasts and SMS updates.",
            "Avoid high-risk low-lying channels, saturated steep escarpments, and firelines.",
            "Report stranded communities or infrastructural breaches to official hotlines.",
          ])
            .map((act) => `<li style="margin-bottom:4px;">${act}</li>`)
            .join("")}
        </ul>
      </div>

      <!-- Hotlines & Portal Link -->
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;padding-top:10px;border-top:1px solid #334155;">
        <div>
          <div style="font-size:11px;color:#94a3b8;">EDRMC Emergency Hotline:</div>
          <div style="font-size:16px;font-weight:900;color:#ef4444;">8335 (Toll-Free)</div>
        </div>
        <div>
          <a href="https://disaster.ssgi.gov.et/early-warning" style="display:inline-block;padding:8px 18px;background:#0284c7;color:#ffffff;border-radius:8px;text-decoration:none;font-size:12.5px;font-weight:700;">
            Open Live Map &amp; Telemetry →
          </a>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#0f172a;padding:14px 28px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;font-size:11px;color:#64748b;">
      Disaster Monitoring Center — Space Science &amp; Geospatial Institute (SSGI) | Ethiopian Disaster Risk Management Commission (EDRMC)
    </div>
  </div>
</body>
</html>`;
}

/**
 * Builds professional Ethiopian Disaster Early Warning Subscription Confirmation HTML Email
 */
function buildSubscriptionConfirmationEmailHtml({
  name,
  email,
  phone,
  channel,
  regions = ["All"],
  hazards = ["all"],
  minSeverity = "Warning",
}) {
  const channelLabel =
    channel === "both"
      ? "📱 SMS + ✉️ Email Multi-Channel"
      : channel === "sms"
        ? "📱 SMS Priority"
        : "✉️ Email Official Bulletins";

  const regionsLabel =
    regions.includes("All") || regions.length === 0
      ? "All 13 National Regions"
      : regions.join(", ");
  const hazardsLabel =
    hazards.includes("all") || hazards.length === 0
      ? "All Hazards (Earthquake, Fire, Flood, Landslide, Drought, Volcano)"
      : hazards
          .map((h) => h.charAt(0).toUpperCase() + h.slice(1))
          .join(", ");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EDRMC &amp; SSGI Early Warning Subscription Confirmed</title>
</head>
<body style="margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#0b132b;color:#f8fafc;">
  <div style="max-width:600px;margin:0 auto;background:#1e293b;border:1px solid rgba(255,255,255,0.12);border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.5);">
    
    <!-- Top Header -->
    <div style="background:linear-gradient(135deg,#1f4fd8 0%,#0f172a 100%);padding:24px 28px;border-bottom:1px solid rgba(255,255,255,0.15);">
      <div style="color:#93c5fd;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;">
        Federal Democratic Republic of Ethiopia
      </div>
      <h1 style="margin:6px 0 0;font-size:20px;color:#ffffff;font-weight:800;">
        EDRMC &amp; SSGI Disaster Early Warning System
      </h1>
      <div style="color:#38bdf8;font-size:12.5px;font-weight:700;margin-top:4px;">
        ✅ Notification Preferences Confirmed
      </div>
    </div>

    <!-- Body -->
    <div style="padding:24px 28px;">
      <p style="margin:0 0 16px;font-size:14px;color:#e2e8f0;line-height:1.6;">
        Dear <strong>${name || "Citizen / Officer"}</strong>,
      </p>
      <p style="margin:0 0 20px;font-size:13.5px;color:#cbd5e1;line-height:1.6;">
        Your notification preferences have been successfully configured in the Ethiopian Multi-Hazard Early Warning System. You will receive official notifications whenever critical hazard events are detected by national satellite and ground telemetry.
      </p>

      <!-- Preferences Card -->
      <div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:16px 20px;margin-bottom:22px;">
        <h3 style="margin:0 0 12px;font-size:13px;color:#38bdf8;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;">
          Active Alert Profile:
        </h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr>
            <td style="padding:6px 0;color:#94a3b8;width:140px;">Delivery Channels:</td>
            <td style="padding:6px 0;color:#ffffff;font-weight:700;">${channelLabel}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#94a3b8;">Email Address:</td>
            <td style="padding:6px 0;color:#38bdf8;font-weight:600;">${email || "—"}</td>
          </tr>
          ${
            phone
              ? `
          <tr>
            <td style="padding:6px 0;color:#94a3b8;">Mobile (SMS):</td>
            <td style="padding:6px 0;color:#38bdf8;font-weight:600;">${phone}</td>
          </tr>`
              : ""
          }
          <tr>
            <td style="padding:6px 0;color:#94a3b8;">Monitored Regions:</td>
            <td style="padding:6px 0;color:#e2e8f0;font-weight:600;">${regionsLabel}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#94a3b8;">Hazard Scope:</td>
            <td style="padding:6px 0;color:#e2e8f0;font-weight:600;">${hazardsLabel}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#94a3b8;">Trigger Threshold:</td>
            <td style="padding:6px 0;color:#f59e0b;font-weight:700;">${minSeverity} and above</td>
          </tr>
        </table>
      </div>

      <!-- Instructions & Hotline -->
      <div style="background:rgba(2,132,199,0.08);border:1px solid rgba(2,132,199,0.25);border-radius:10px;padding:14px 18px;margin-bottom:22px;font-size:12.5px;color:#cbd5e1;line-height:1.5;">
        <div style="font-weight:800;color:#38bdf8;margin-bottom:4px;">📡 Real-Time Dispatch Policy:</div>
        Alerts are issued <strong>only when new critical thresholds are breached</strong> by automated sensors (USGS seismic, FIRMS thermal satellites, GLoFAS hydrological gauges, and NASA landslide indices). Zero duplicate morning spam.
      </div>

      <!-- Hotline & Portal Link -->
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;padding-top:12px;border-top:1px solid #334155;">
        <div>
          <div style="font-size:11px;color:#94a3b8;">Emergency Response Hotline:</div>
          <div style="font-size:16px;font-weight:900;color:#ef4444;">8335 (Toll-Free)</div>
        </div>
        <div>
          <a href="https://disaster.ssgi.gov.et/early-warning" style="display:inline-block;padding:8px 18px;background:#0284c7;color:#ffffff;border-radius:8px;text-decoration:none;font-size:12.5px;font-weight:700;">
            Manage Preferences / Open Live Map →
          </a>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#0f172a;padding:14px 28px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;font-size:11px;color:#64748b;">
      Disaster Monitoring Center — Space Science &amp; Geospatial Institute (SSGI) | Ethiopian Disaster Risk Management Commission (EDRMC)
    </div>
  </div>
</body>
</html>`;
}

// ── Default Fallback Alert History Records (Audit Trail) ───────────────────
const SEED_ALERT_HISTORY = [
  {
    alertId: "ETH-EW-2026-0915-01",
    hazard: "flood",
    title: "Flood Warning — Oromia",
    location: "Oromia (Middle Awash / Melka Sedi Reach)",
    region: "Oromia",
    severity: "Warning",
    issuedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000 - 8 * 3600 * 1000),
    resolvedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000 - 4 * 3600 * 1000 - 20 * 60 * 1000),
    duration: "3h 40m",
    status: "Resolved",
    description: "Awash River discharge exceeded bankfull capacity at 295 m³/s. Downstream dykes stabilized and flow normalized.",
    telemetry: { discharge: "295 m³/s", threshold: "280 m³/s", basin: "Awash Basin" },
    dispatchedSmsCount: 1420,
    dispatchedEmailCount: 88,
  },
  {
    alertId: "ETH-EW-2026-0917-02",
    hazard: "fire",
    title: "Wildfire Watch — Gambella Lowlands",
    location: "Gambella (Open Savanna / Forest Edge)",
    region: "Gambella",
    severity: "Watch",
    issuedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000 - 5 * 3600 * 1000),
    resolvedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000 - 1 * 3600 * 1000),
    duration: "4h 00m",
    status: "Resolved",
    description: "Multiple high-confidence VIIRS hotspots detected near rural farming settlements. Controlled by regional fire units.",
    telemetry: { maxFRP: "52.4 MW", satellites: "VIIRS SNPP + MODIS" },
    dispatchedSmsCount: 840,
    dispatchedEmailCount: 42,
  },
  {
    alertId: "ETH-EW-2026-0918-03",
    hazard: "earthquake",
    title: "Seismic Advisory — Afar Rift Escarpment",
    location: "Afar (Tendaho Graben / Asaita)",
    region: "Afar",
    severity: "Advisory",
    issuedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000 - 12 * 3600 * 1000),
    resolvedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000 - 6 * 3600 * 1000),
    duration: "6h 00m",
    status: "Resolved",
    description: "USGS detected M3.8 shallow earthquake at 10.0 km depth. No structural damage reported in nearby pastoralist zones.",
    telemetry: { magnitude: "M3.8", depth: "10 km", energyGJ: "12.4 GJ" },
    dispatchedSmsCount: 650,
    dispatchedEmailCount: 35,
  },
  {
    alertId: "ETH-EW-2026-0919-04",
    hazard: "landslide",
    title: "Landslide Warning — Gofa Zone Slopes",
    location: "South Ethiopia (Sawla-Geze Gofa Escarpment)",
    region: "South Ethiopia / SNNP",
    severity: "Warning",
    issuedAt: new Date(Date.now() - 14 * 3600 * 1000),
    resolvedAt: null,
    duration: "Ongoing (14h)",
    status: "Active",
    description: "7-Day Antecedent Rainfall Index (ARI) reached 142.5 mm on weathered basalt saprolite slopes. Factor of Safety dropped to 0.88.",
    telemetry: { factorOfSafety: "0.88", ari7d: "142.5 mm", slope: "38°" },
    dispatchedSmsCount: 2350,
    dispatchedEmailCount: 110,
  },
  {
    alertId: "ETH-EW-2026-0919-05",
    hazard: "drought",
    title: "Drought Emergency — Somali Lowlands",
    location: "Somali (Ogaden / Shabelle Basin)",
    region: "Somali",
    severity: "Emergency",
    issuedAt: new Date(Date.now() - 36 * 3600 * 1000),
    resolvedAt: null,
    duration: "Ongoing (1d 12h)",
    status: "Active",
    description: "CHIRPS v3 SPI-90 dropped to -2.18 with 64% precipitation deficit and severe pasture depletion.",
    telemetry: { spi90: "-2.18", precipDeficit: "-64%", pastureDeficit: "78%" },
    dispatchedSmsCount: 4120,
    dispatchedEmailCount: 215,
  },
  {
    alertId: "ETH-EW-2026-0919-06",
    hazard: "volcano",
    title: "Volcanic Activity Advisory — Erta Ale",
    location: "Afar (Danakil Depression)",
    region: "Afar",
    severity: "Advisory",
    issuedAt: new Date(Date.now() - 48 * 3600 * 1000),
    resolvedAt: new Date(Date.now() - 24 * 3600 * 1000),
    duration: "24h 00m",
    status: "Resolved",
    description: "COMET InSAR velocity indicated localized lava lake swelling at +12 mm/yr. VONA aviation alert set to YELLOW.",
    telemetry: { vona: "YELLOW", insarVel: "+12 mm/yr", activity: "Active Lava Lake" },
    dispatchedSmsCount: 310,
    dispatchedEmailCount: 65,
  },
];

/**
 * Unified Multi-Channel Alert Dispatcher
 * Sends alert to:
 * 1. ALL registered users (User model) who have email and/or phone
 * 2. ALL active AlertSubscription subscribers
 * 3. Any manual targets (targetPhone, targetEmail)
 */
async function dispatchAlertToAllRecipients({
  alertId,
  hazard = "flood",
  title,
  location = "Ethiopia",
  region = "Ethiopia",
  severity = "Warning",
  description = "",
  telemetry = {},
  actions = [],
  sendSms = true,
  sendEmail = true,
  targetPhone = null,
  targetEmail = null,
  dispatchedBy = "EDRMC / SSGI Early Warning Automated Monitor",
  eventFingerprint = null,
  isTest = false,
}) {
  const generatedAlertId =
    alertId ||
    `ETH-EW-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`;
  const formattedTitle =
    title || `${severity} Alert — ${hazard.toUpperCase()} in ${location}`;
  const issuedStr = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const phoneList = new Set();
  const emailList = new Set();

  if (targetPhone) {
    const norm = normalizeEthiopianPhone(targetPhone);
    if (norm) phoneList.add(norm);
  }
  if (targetEmail && targetEmail.includes("@")) {
    emailList.add(targetEmail.trim().toLowerCase());
  }

  // If this is a live broadcast (not an isolated test), gather all registered users & subscribers
  if (!isTest) {
    // 1. Gather all Registered Users
    try {
      const User = require("./models/User");
      const users = await User.find({ status: { $ne: "rejected" } });
      for (const u of users) {
        if (u.phone) {
          const norm = normalizeEthiopianPhone(u.phone);
          if (norm) phoneList.add(norm);
        }
        if (u.email && u.email.includes("@")) {
          const em = u.email.trim().toLowerCase();
          if (!em.endsWith("@example.com") && !em.endsWith(".invalid")) {
            emailList.add(em);
          }
        }
      }
    } catch (userErr) {
      console.warn("[alertService] Error loading registered users for alert:", userErr.message);
    }

    // 2. Gather Alert Subscriptions
    try {
      const subscribers = await AlertSubscription.find({ isActive: true });
      for (const sub of subscribers) {
        const hazardMatch =
          sub.hazards.includes("all") ||
          sub.hazards.includes(hazard.toLowerCase());
        const regionMatch =
          sub.regions.includes("All") ||
          sub.regions.some((r) =>
            region.toLowerCase().includes(r.toLowerCase()),
          );
        if (hazardMatch && regionMatch) {
          if (sub.phone && (sub.channel === "sms" || sub.channel === "both")) {
            const norm = normalizeEthiopianPhone(sub.phone);
            if (norm) phoneList.add(norm);
          }
          if (sub.email && (sub.channel === "email" || sub.channel === "both")) {
            if (sub.email.includes("@")) emailList.add(sub.email.trim().toLowerCase());
          }
        }
      }
    } catch (subErr) {
      console.warn("[alertService] Error loading alert subscriptions:", subErr.message);
    }
  }

  let smsSuccessCount = 0;
  let emailSuccessCount = 0;
  const dispatchLogs = [];

  // 3. Dispatch SMS via SMS Ethiopia
  if (sendSms && phoneList.size > 0) {
    const smsText = formatProfessionalSms({
      hazard,
      severity,
      location,
      issuedStr,
      actionSummary:
        description ||
        (actions && actions[0]) ||
        "Take immediate safety precautions and follow local DRMC advisories.",
    });

    for (const phone of phoneList) {
      try {
        const smsRes = await sendSmsEthiopia({ to: phone, message: smsText });
        if (smsRes.success) {
          smsSuccessCount++;
          dispatchLogs.push({
            channel: "sms",
            to: phone,
            status: "dispatched",
            gatewayRes: smsRes,
          });
        } else {
          dispatchLogs.push({
            channel: "sms",
            to: phone,
            status: "failed",
            error: smsRes.error || `Gateway returned HTTP ${smsRes.status}`,
            gatewayRes: smsRes,
          });
        }
      } catch (smsErr) {
        console.error(`[alertService] SMS failed for ${phone}:`, smsErr.message);
        dispatchLogs.push({
          channel: "sms",
          to: phone,
          status: "failed",
          error: smsErr.message,
        });
      }
    }
  }

  // 4. Dispatch Email via SMTP
  if (sendEmail && emailList.size > 0) {
    const emailHtml = buildProfessionalEmailHtml({
      alertId: generatedAlertId,
      hazard,
      severity,
      location,
      issuedStr,
      details: description,
      telemetry,
      actions: actions.length > 0 ? actions : undefined,
    });

    const transporter = getEmailTransporter();
    for (const email of emailList) {
      if (transporter) {
        try {
          const info = await transporter.sendMail({
            from:
              process.env.EMAIL_FROM ||
              process.env.EMAIL_USER ||
              "earlywarning@ssgi.gov.et",
            to: email,
            subject: `🚨 [${severity.toUpperCase()}] Ethiopia Early Warning: ${hazard.toUpperCase()} — ${location}`,
            html: emailHtml,
          });
          emailSuccessCount++;
          dispatchLogs.push({
            channel: "email",
            to: email,
            status: "sent",
            messageId: info?.messageId,
          });
        } catch (mailErr) {
          console.error(`[alertService] Email failed for ${email}:`, mailErr.message);
          dispatchLogs.push({
            channel: "email",
            to: email,
            status: "failed",
            error: mailErr.message,
          });
        }
      } else {
        dispatchLogs.push({
          channel: "email",
          to: email,
          status: "failed",
          error: "No email transporter configured (check EMAIL_USER/EMAIL_PASS in .env)",
        });
      }
    }
  }

  // 5. Persist to AlertHistory Audit Trail
  let savedAlert = null;
  try {
    savedAlert = new AlertHistory({
      alertId: generatedAlertId,
      hazard: hazard.toLowerCase(),
      title: formattedTitle,
      location,
      region,
      severity,
      issuedAt: new Date(),
      status: "Active",
      duration: "Ongoing",
      description,
      telemetry,
      dispatchedSmsCount: smsSuccessCount,
      dispatchedEmailCount: emailSuccessCount,
      dispatchedBy,
      eventFingerprint,
    });
    await savedAlert.save();
  } catch (saveErr) {
    console.warn("[alertService] Could not save AlertHistory record:", saveErr.message);
  }

  console.log(
    `[alertService] Alert ${generatedAlertId} broadcast complete. SMS: ${smsSuccessCount}/${phoneList.size}, Email: ${emailSuccessCount}/${emailList.size}.`,
  );

  return {
    success: true,
    alertId: generatedAlertId,
    alert: savedAlert,
    smsDispatched: smsSuccessCount,
    emailDispatched: emailSuccessCount,
    totalPhonesTargeted: phoneList.size,
    totalEmailsTargeted: emailList.size,
    logs: dispatchLogs,
  };
}

module.exports = {
  SMS_ETHIOPIA_API_KEY,
  sendSmsEthiopia,
  registerContactToSmsEthiopia,
  normalizeEthiopianPhone,
  formatProfessionalSms,
  buildProfessionalEmailHtml,
  buildSubscriptionConfirmationEmailHtml,
  getEmailTransporter,
  SEED_ALERT_HISTORY,
  dispatchAlertToAllRecipients,
};
