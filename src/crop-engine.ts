/**
 * Crop Engine & Coordinate Geometry Resolver
 */

import type { BoundingBox, CropVisionRequest, CropVisionResponse, VisionCropPreset } from "./types";
import { getVisionTokenCost } from "./vision-tokens";

const PRESET_MAP: Record<VisionCropPreset, { x_pct: number; y_pct: number; w_pct: number; h_pct: number }> = {
  hero: { x_pct: 0.05, y_pct: 0.10, w_pct: 0.90, h_pct: 0.40 },
  main_content: { x_pct: 0.15, y_pct: 0.15, w_pct: 0.70, h_pct: 0.70 },
  pricing_table: { x_pct: 0.05, y_pct: 0.30, w_pct: 0.90, h_pct: 0.45 },
  checkout_form: { x_pct: 0.20, y_pct: 0.20, w_pct: 0.60, h_pct: 0.60 },
  navbar: { x_pct: 0.0, y_pct: 0.0, w_pct: 1.0, h_pct: 0.12 },
  footer: { x_pct: 0.0, y_pct: 0.85, w_pct: 1.0, h_pct: 0.15 },
  center_square: { x_pct: 0.25, y_pct: 0.25, w_pct: 0.50, h_pct: 0.50 },
  mobile_viewport: { x_pct: 0.30, y_pct: 0.05, w_pct: 0.40, h_pct: 0.90 }
};

export function resolveCropBox(req: CropVisionRequest, origW: number, origH: number): BoundingBox {
  let box: BoundingBox;

  if (req.crop_box) {
    box = { ...req.crop_box };
  } else if (req.crop_pct) {
    box = {
      x: Math.round(req.crop_pct.x_pct * origW),
      y: Math.round(req.crop_pct.y_pct * origH),
      width: Math.round(req.crop_pct.width_pct * origW),
      height: Math.round(req.crop_pct.height_pct * origH)
    };
  } else if (req.preset && PRESET_MAP[req.preset]) {
    const p = PRESET_MAP[req.preset];
    box = {
      x: Math.round(p.x_pct * origW),
      y: Math.round(p.y_pct * origH),
      width: Math.round(p.w_pct * origW),
      height: Math.round(p.h_pct * origH)
    };
  } else {
    // Default to main content focus
    box = {
      x: Math.round(origW * 0.1),
      y: Math.round(origH * 0.1),
      width: Math.round(origW * 0.8),
      height: Math.round(origH * 0.8)
    };
  }

  // Apply padding if requested
  if (req.padding_px && req.padding_px > 0) {
    box.x = Math.max(0, box.x - req.padding_px);
    box.y = Math.max(0, box.y - req.padding_px);
    box.width = Math.min(origW - box.x, box.width + req.padding_px * 2);
    box.height = Math.min(origH - box.y, box.height + req.padding_px * 2);
  }

  // Clamp within image bounds
  box.x = Math.max(0, Math.min(box.x, origW - 1));
  box.y = Math.max(0, Math.min(box.y, origH - 1));
  box.width = Math.max(10, Math.min(box.width, origW - box.x));
  box.height = Math.max(10, Math.min(box.height, origH - box.y));

  return box;
}

export function executeCrop(req: CropVisionRequest): CropVisionResponse {
  const start = Date.now();
  const origW = req.original_width || 1920;
  const origH = req.original_height || 1080;

  const cropBox = resolveCropBox(req, origW, origH);
  const origCost = getVisionTokenCost(origW, origH, "high");

  // If normalize_for_vision is enabled (default true), scale crop to standard max 768px for LLM vision
  let normW = cropBox.width;
  let normH = cropBox.height;
  if (req.normalize_for_vision !== false && (normW > 768 || normH > 768)) {
    const scale = Math.min(768 / normW, 768 / normH);
    normW = Math.round(normW * scale);
    normH = Math.round(normH * scale);
  }

  const croppedCost = getVisionTokenCost(normW, normH, "high");

  const tokensSaved = Math.max(0, origCost.openai_gpt4o_tokens - croppedCost.openai_gpt4o_tokens);
  const pctSaved = origCost.openai_gpt4o_tokens > 0 
    ? Number(((tokensSaved / origCost.openai_gpt4o_tokens) * 100).toFixed(1))
    : 0;

  const dollarsSaved = Number((origCost.cost_per_10k_calls_usd.gpt4o - croppedCost.cost_per_10k_calls_usd.gpt4o).toFixed(2));

  // Generate lightweight SVG viewport wrapper for surgical AI inspection
  const svgPreview = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${cropBox.x} ${cropBox.y} ${cropBox.width} ${cropBox.height}" width="${cropBox.width}" height="${cropBox.height}"><image href="${req.image_url || 'placeholder.jpg'}" width="${origW}" height="${origH}"/></svg>`;

  return {
    success: true,
    original_dimensions: { width: origW, height: origH },
    cropped_dimensions: { width: cropBox.width, height: cropBox.height },
    bounding_box: cropBox,
    token_savings: {
      original_tokens: origCost,
      cropped_tokens: croppedCost,
      tokens_saved: tokensSaved,
      savings_percentage: pctSaved,
      estimated_dollars_saved_per_10k_calls: Math.max(0, dollarsSaved)
    },
    output_format: req.target_format || "coordinates_only",
    preview_url_or_svg: req.target_format === "svg_clip" ? svgPreview : `crop:${cropBox.x},${cropBox.y},${cropBox.width},${cropBox.height}`,
    execution_time_ms: Date.now() - start
  };
}
