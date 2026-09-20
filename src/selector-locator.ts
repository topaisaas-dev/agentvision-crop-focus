/**
 * DOM & CSS Selector Heuristic Resolver for Automated Vision Agents
 */

import type { BoundingBox, FocusSelectorRequest, FocusSelectorResponse, PercentageBox } from "./types";

export function locateSelectorHeuristics(req: FocusSelectorRequest): FocusSelectorResponse {
  const html = req.html_snippet || "";
  const selector = req.selector.trim();
  const vp = req.viewport || { width: 1920, height: 1080 };

  // Heuristic estimation based on typical layout conventions
  let x_pct = 0.1;
  let y_pct = 0.2;
  let w_pct = 0.8;
  let h_pct = 0.6;
  let tag = "div";

  const lower = selector.toLowerCase();
  if (lower.includes("price") || lower.includes("pricing") || lower.includes("tier")) {
    x_pct = 0.08;
    y_pct = 0.25;
    w_pct = 0.84;
    h_pct = 0.50;
    tag = "pricing-section";
  } else if (lower.includes("nav") || lower.includes("header") || lower.includes("menu")) {
    x_pct = 0.0;
    y_pct = 0.0;
    w_pct = 1.0;
    h_pct = 0.10;
    tag = "nav";
  } else if (lower.includes("form") || lower.includes("checkout") || lower.includes("login") || lower.includes("signup")) {
    x_pct = 0.25;
    y_pct = 0.20;
    w_pct = 0.50;
    h_pct = 0.60;
    tag = "form";
  } else if (lower.includes("table") || lower.includes("invoice") || lower.includes("data-grid")) {
    x_pct = 0.05;
    y_pct = 0.20;
    w_pct = 0.90;
    h_pct = 0.55;
    tag = "table";
  } else if (lower.includes("footer")) {
    x_pct = 0.0;
    y_pct = 0.85;
    w_pct = 1.0;
    h_pct = 0.15;
    tag = "footer";
  }

  // Refine if explicit style coordinates or dimensions exist in snippet
  const styleMatch = html.match(/width:\s*(\d+)px/i);
  if (styleMatch) {
    const parsedW = parseInt(styleMatch[1], 10);
    if (parsedW > 0 && parsedW <= vp.width) {
      w_pct = Number((parsedW / vp.width).toFixed(2));
    }
  }

  const box: BoundingBox = {
    x: Math.round(x_pct * vp.width),
    y: Math.round(y_pct * vp.height),
    width: Math.round(w_pct * vp.width),
    height: Math.round(h_pct * vp.height)
  };

  const pBox: PercentageBox = {
    x_pct: Number(x_pct.toFixed(3)),
    y_pct: Number(y_pct.toFixed(3)),
    width_pct: Number(w_pct.toFixed(3)),
    height_pct: Number(h_pct.toFixed(3))
  };

  const playwright = `// Playwright Surgical Element Screenshot\nconst element = await page.locator('${selector}');\nawait element.screenshot({ path: 'vision_crop_${tag}.png' });`;
  const puppeteer = `// Puppeteer Element Clip Screenshot\nconst el = await page.$('${selector}');\nawait el.screenshot({ path: 'vision_crop_${tag}.png' });`;

  return {
    selector_matched: selector,
    target_element: tag,
    estimated_bounding_box: box,
    recommended_crop_parameters: pBox,
    playwright_snippet: playwright,
    puppeteer_snippet: puppeteer
  };
}
