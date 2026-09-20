/**
 * AgentVision Crop & Focus API - Cloudflare Workers Edge Micro-service
 * Surgical headless crop and focus API for multimodal AI models (GPT-4o, Claude 3.5 Sonnet, Gemini Flash).
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { executeCrop } from "./crop-engine";
import { analyzeTokenBudget } from "./vision-tokens";
import { locateSelectorHeuristics } from "./selector-locator";
import type { CropVisionRequest, TokenCalcRequest, FocusSelectorRequest } from "./types";

const app = new Hono();

// Global CORS & Edge headers
app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST", "OPTIONS"] }));
app.use("*", async (c, next) => {
  await next();
  c.header("X-Powered-By", "TopAISaaS-AgentVision-v1");
  c.header("X-Zero-Token-Cost", "true");
});

/**
 * 1. GET /v1/health - Service Healthcheck
 */
app.get("/v1/health", (c) => {
  return c.json({
    status: "healthy",
    uptime: "24/7",
    version: "1.0.0",
    engine: "TopAISaaS-AgentVision-v1",
    timestamp: new Date().toISOString(),
    capabilities: [
      "surgical-pixel-and-percentage-crop",
      "vision-crop-presets-hero-pricing-form",
      "openai-512px-tile-token-calculator",
      "claude-and-gemini-vision-estimator",
      "css-selector-bounding-box-locator",
      "zero-llm-token-cost"
    ]
  });
});

/**
 * 2. POST /v1/vision/crop - Surgical Headless Crop & Focus
 */
app.post("/v1/vision/crop", async (c) => {
  try {
    const body = await c.req.json<CropVisionRequest>().catch(() => ({} as CropVisionRequest));
    const result = executeCrop(body);

    c.header("X-Vision-Original-Tokens", String(result.token_savings.original_tokens.openai_gpt4o_tokens));
    c.header("X-Vision-Cropped-Tokens", String(result.token_savings.cropped_tokens.openai_gpt4o_tokens));
    c.header("X-Vision-Savings-Pct", `${result.token_savings.savings_percentage}%`);

    return c.json(result);
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

/**
 * 3. POST /v1/vision/token-calc - Multimodal Token Economics & Budgeting
 */
app.post("/v1/vision/token-calc", async (c) => {
  try {
    const body = await c.req.json<TokenCalcRequest>().catch(() => ({} as TokenCalcRequest));
    const w = body.width || 1920;
    const h = body.height || 1080;
    const detail = body.detail || "high";

    const report = analyzeTokenBudget(w, h, detail);
    return c.json({ success: true, ...report });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

/**
 * 4. POST /v1/vision/focus-selector - DOM Element Bounding Box Locator
 */
app.post("/v1/vision/focus-selector", async (c) => {
  try {
    const body = await c.req.json<FocusSelectorRequest>().catch(() => ({} as FocusSelectorRequest));
    if (!body.selector) {
      return c.json({ success: false, error: "Missing required 'selector' string parameter" }, 400);
    }

    const res = locateSelectorHeuristics(body);
    return c.json({ success: true, ...res });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 400);
  }
});

/**
 * 5. GET /openapi.json - OpenAPI 3.0.3 Specification
 */
app.get("/openapi.json", (c) => {
  return c.json({
    openapi: "3.0.3",
    info: {
      title: "AgentVision Crop & Focus API",
      description: "Surgical headless crop and focus API for multimodal AI models (GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Flash). Reduces vision token consumption and cuts API costs by 60% to 85%.",
      version: "1.0.0",
      contact: {
        name: "TopAI SaaS Dev",
        email: "top.ai.saas@gmail.com"
      }
    },
    servers: [
      {
        url: "https://agentvision-crop-focus.topaisaas.workers.dev",
        description: "Cloudflare Workers Global Edge Production"
      }
    ],
    paths: {
      "/v1/vision/crop": {
        post: {
          summary: "Surgical Headless Image Crop",
          description: "Calculates precise bounding boxes, crop geometry, and multimodal token reduction for target image regions (hero, pricing table, form, navbar).",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    original_width: { type: "integer", example: 1920 },
                    original_height: { type: "integer", example: 1080 },
                    preset: { type: "string", enum: ["hero", "main_content", "pricing_table", "checkout_form", "navbar", "footer"], example: "pricing_table" },
                    padding_px: { type: "integer", example: 20 },
                    target_format: { type: "string", enum: ["coordinates_only", "svg_clip"], default: "coordinates_only" }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Cropped bounding box and token savings returned" }
          }
        }
      },
      "/v1/vision/token-calc": {
        post: {
          summary: "Multimodal Vision Token Calculator",
          description: "Accurately calculates OpenAI 512x512 tile grid tokens, Claude 3.5 Sonnet tokens, and Gemini token costs for any arbitrary resolution.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["width", "height"],
                  properties: {
                    width: { type: "integer", example: 1920 },
                    height: { type: "integer", example: 1080 },
                    detail: { type: "string", enum: ["low", "high"], default: "high" }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Calculated token budget and costs" }
          }
        }
      },
      "/v1/vision/focus-selector": {
        post: {
          summary: "DOM Selector Bounding Box Estimator",
          description: "Resolves CSS selectors into crop coordinates and generates automation code snippets for Playwright and Puppeteer.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["selector"],
                  properties: {
                    selector: { type: "string", example: "#pricing-table" },
                    viewport: {
                      type: "object",
                      properties: {
                        width: { type: "integer", example: 1920 },
                        height: { type: "integer", example: 1080 }
                      }
                    }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Coordinates and code snippets returned" }
          }
        }
      },
      "/v1/health": {
        get: {
          summary: "Healthcheck & Capability Matrix",
          responses: {
            "200": { description: "Service is online" }
          }
        }
      }
    }
  });
});

/**
 * 6. GET / - Interactive Playground & Landing Page
 */
app.get("/", (c) => {
  const accept = c.req.header("accept") || "";
  const format = c.req.query("format");

  if (format === "json" || (!accept.includes("text/html") && accept.includes("application/json"))) {
    return c.json({
      service: "AgentVision Crop & Focus API",
      tagline: "Surgical headless crop and focus API for multimodal AI models (GPT-4o, Claude 3.5, Gemini)",
      version: "1.0.0",
      docs_url: "/openapi.json",
      health_url: "/v1/health",
      endpoints: {
        "POST /v1/vision/crop": "Crop image coordinates and calculate token savings",
        "POST /v1/vision/token-calc": "Accurate vision token calculator (OpenAI, Claude, Gemini)",
        "POST /v1/vision/focus-selector": "Locate element bounding box from CSS selector",
        "GET /openapi.json": "OpenAPI 3.0.3 specification",
        "GET /v1/health": "Health and capabilities list"
      }
    });
  }

  c.header("Cache-Control", "no-cache, no-store, must-revalidate");

  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AgentVision Crop & Focus API • Live Multimodal Playground</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #090d16; color: #e2e8f0; padding: 40px 20px; line-height: 1.6; }
    .container { max-width: 950px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 36px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(255, 214, 0, 0.15); color: #ffd600; border: 1px solid rgba(255, 214, 0, 0.3); padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 13px; margin-bottom: 16px; }
    .badge::before { content: ''; width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 8px #22c55e; }
    h1 { font-size: 28px; font-weight: 800; color: #ffffff; margin-bottom: 8px; }
    p.subtitle { font-size: 16px; color: #94a3b8; margin-bottom: 24px; }
    .playground { background: #1a2234; border: 1px solid #2d3748; border-radius: 12px; padding: 24px; margin-bottom: 28px; }
    .presets { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .preset-btn { background: #0b1120; border: 1px solid #334155; color: #cbd5e1; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .preset-btn.active, .preset-btn:hover { border-color: #ffd600; color: #ffd600; }
    .viewport-preview { position: relative; width: 100%; height: 260px; background: #0b1120; border: 2px dashed #334155; border-radius: 10px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .simulated-page { width: 100%; height: 100%; position: absolute; top: 0; left: 0; padding: 20px; opacity: 0.35; font-family: monospace; font-size: 11px; }
    .crop-reticle { position: absolute; border: 2px solid #ffd600; background: rgba(255, 214, 0, 0.12); border-radius: 6px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 15px rgba(255, 214, 0, 0.3); }
    .crop-label { position: absolute; top: -24px; left: 0; background: #ffd600; color: #000; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; }
    .action-row { display: flex; justify-content: space-between; align-items: center; }
    button.main-btn { background: #ffd600; color: #000; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer; transition: transform 0.1s, background 0.2s; }
    button.main-btn:hover { background: #ffea00; }
    button.main-btn:active { transform: scale(0.98); }
    #metrics { margin-top: 20px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .stat-card { background: #0b1120; border: 1px solid #2d3748; border-radius: 8px; padding: 14px; text-align: center; }
    .stat-val { font-size: 22px; font-weight: 800; color: #ffd600; }
    .stat-lbl { font-size: 12px; color: #94a3b8; text-transform: uppercase; margin-top: 4px; }
    pre { background: #070b12; border: 1px solid #1e293b; color: #38bdf8; padding: 14px; border-radius: 8px; overflow-x: auto; max-height: 250px; font-size: 12px; font-family: monospace; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 24px; }
    .chip { background: #1e293b; border: 1px solid #334155; color: #cbd5e1; padding: 6px 12px; border-radius: 6px; font-size: 13px; text-decoration: none; }
    .links-bar { margin-top: 24px; padding-top: 20px; border-top: 1px solid #1f2937; display: flex; gap: 16px; font-size: 14px; }
    .links-bar a { color: #ffd600; text-decoration: none; font-weight: 600; }
    .links-bar a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">Edge Engine Live • Sub-Millisecond</div>
    <h1>AgentVision Crop & Focus API</h1>
    <p class="subtitle">Surgical crop & focus for multimodal LLMs (GPT-4o, Claude 3.5 Sonnet, Gemini Flash). Slash vision tokens by up to 85%.</p>

    <div class="playground">
      <div class="presets">
        <button class="preset-btn active" onclick="applyPreset('pricing_table')">🏷️ Pricing Table</button>
        <button class="preset-btn" onclick="applyPreset('hero')">🎯 Hero Section</button>
        <button class="preset-btn" onclick="applyPreset('checkout_form')">📝 Checkout Form</button>
        <button class="preset-btn" onclick="applyPreset('navbar')">🧭 Navigation Bar</button>
      </div>

      <div class="viewport-preview">
        <div class="simulated-page">
          &lt;header nav-bar /&gt;<br>
          &lt;section class="hero-banner"&gt;Autonomous A2A APIs&lt;/section&gt;<br>
          &lt;div id="pricing-matrix"&gt;Basic: $0 | Pro: $29 | Ultra: $99 | Mega: $249&lt;/div&gt;<br>
          &lt;footer copyright="TopAISaaS 2026" /&gt;
        </div>
        <div id="reticle" class="crop-reticle" style="top: 30%; left: 5%; width: 90%; height: 45%;">
          <div id="reticleLabel" class="crop-label">pricing_table (1728 x 486 px)</div>
        </div>
      </div>

      <div class="action-row">
        <span style="font-size: 13px; color: #94a3b8;">1920x1080 Simulated Viewport</span>
        <button class="main-btn" onclick="calculateSavings()">Compute Vision Savings</button>
      </div>

      <div id="metrics">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-val" id="origTokens">1,445</div>
            <div class="stat-lbl">Full Image Tokens (GPT-4o)</div>
          </div>
          <div class="stat-card">
            <div class="stat-val" id="croppedTokens">425</div>
            <div class="stat-lbl">Cropped Tokens</div>
          </div>
          <div class="stat-card">
            <div class="stat-val" id="savingsPct" style="color: #22c55e;">-70.6%</div>
            <div class="stat-lbl">Token Reduction</div>
          </div>
          <div class="stat-card">
            <div class="stat-val" id="dollarsSaved" style="color: #ffd600;">$25.50</div>
            <div class="stat-lbl">Saved / 10k Calls</div>
          </div>
        </div>

        <pre id="outputJson"></pre>
      </div>
    </div>

    <div class="chips">
      <span class="chip">👁️ GPT-4o & Claude 3.5 Calibrated</span>
      <span class="chip">✂️ Sub-Millisecond Surgical Crop</span>
      <span class="chip">📉 Up to 85% Token Bill Reduction</span>
      <span class="chip">🤖 Playwright & Puppeteer Code Gen</span>
      <span class="chip">⚡ Pure Edge Serverless (0 € Cost)</span>
    </div>

    <div class="links-bar">
      <a href="/openapi.json" target="_blank">📄 OpenAPI 3.0.3 Spec</a>
      <a href="/v1/health" target="_blank">🩺 Health Status</a>
      <a href="https://rapidapi.com/user/topaisaas-dev" target="_blank">⚡ RapidAPI Marketplace</a>
    </div>
  </div>

  <script>
    let currentPreset = 'pricing_table';

    const PRESET_STYLES = {
      pricing_table: { top: '30%', left: '5%', width: '90%', height: '45%', label: 'pricing_table (1728 x 486 px)' },
      hero: { top: '10%', left: '5%', width: '90%', height: '40%', label: 'hero (1728 x 432 px)' },
      checkout_form: { top: '20%', left: '20%', width: '60%', height: '60%', label: 'checkout_form (1152 x 648 px)' },
      navbar: { top: '0%', left: '0%', width: '100%', height: '12%', label: 'navbar (1920 x 130 px)' }
    };

    function applyPreset(preset) {
      currentPreset = preset;
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');

      const s = PRESET_STYLES[preset];
      const r = document.getElementById('reticle');
      r.style.top = s.top;
      r.style.left = s.left;
      r.style.width = s.width;
      r.style.height = s.height;
      document.getElementById('reticleLabel').innerText = s.label;

      calculateSavings();
    }

    async function calculateSavings() {
      try {
        const res = await fetch('/v1/vision/crop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            original_width: 1920,
            original_height: 1080,
            preset: currentPreset,
            padding_px: 10
          })
        });
        const data = await res.json();
        
        document.getElementById('origTokens').innerText = data.token_savings.original_tokens.openai_gpt4o_tokens.toLocaleString();
        document.getElementById('croppedTokens').innerText = data.token_savings.cropped_tokens.openai_gpt4o_tokens.toLocaleString();
        document.getElementById('savingsPct').innerText = '-' + data.token_savings.savings_percentage + '%';
        document.getElementById('dollarsSaved').innerText = '$' + data.token_savings.estimated_dollars_saved_per_10k_calls;
        document.getElementById('outputJson').innerText = JSON.stringify(data, null, 2);
      } catch (e) {
        console.error(e);
      }
    }

    calculateSavings();
  </script>
</body>
</html>`);
});

export default app;
