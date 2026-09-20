/**
 * Vision Model Token Estimator & Economics Calculator
 * Implements exact formulas for OpenAI GPT-4o Vision, Anthropic Claude 3.5, and Google Gemini
 */

import type { VisionTokenCost, TokenCalcResponse } from "./types";

/**
 * Calculates OpenAI Vision token count using the official 512x512 tile algorithm.
 */
export function calculateOpenAIVisionTokens(width: number, height: number, detail: "low" | "high" = "high"): { tokens: number; tiles: number } {
  if (detail === "low") {
    return { tokens: 85, tiles: 0 };
  }

  // Step 1: Scale to fit inside 2048 x 2048 square
  let w = width;
  let h = height;

  if (w > 2048 || h > 2048) {
    const ratio = Math.min(2048 / w, 2048 / h);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);
  }

  // Step 2: Scale such that shortest side is 768px (if greater than 768)
  if (w > 768 && h > 768) {
    if (w < h) {
      const ratio = 768 / w;
      w = 768;
      h = Math.round(h * ratio);
    } else {
      const ratio = 768 / h;
      h = 768;
      w = Math.round(w * ratio);
    }
  }

  // Step 3: Count number of 512x512 tiles
  const tilesX = Math.ceil(w / 512);
  const tilesY = Math.ceil(h / 512);
  const totalTiles = tilesX * tilesY;

  // Step 4: 85 base tokens + 170 tokens per tile
  const totalTokens = 85 + (totalTiles * 170);

  return { tokens: totalTokens, tiles: totalTiles };
}

/**
 * Calculates Claude 3.5 Sonnet image tokens (approximately 1 token per 750 pixels)
 */
export function calculateClaudeTokens(width: number, height: number): number {
  const pixels = width * height;
  return Math.max(100, Math.ceil(pixels / 750));
}

/**
 * Calculates Gemini 1.5 Flash image tokens (standard fixed image token bucket)
 */
export function calculateGeminiTokens(): number {
  return 258;
}

/**
 * Complete token cost report across leading multimodal models
 */
export function getVisionTokenCost(width: number, height: number, detail: "low" | "high" = "high"): VisionTokenCost {
  const { tokens: gpt4oTokens } = calculateOpenAIVisionTokens(width, height, detail);
  const claudeTokens = calculateClaudeTokens(width, height);
  const geminiTokens = calculateGeminiTokens();

  // Rates per 1,000,000 tokens
  const RATE_GPT4O = 2.50;
  const RATE_CLAUDE = 3.00;
  const RATE_GEMINI = 0.075;

  const multiplier = 10000; // 10,000 calls
  const costGpt4o = (gpt4oTokens * multiplier / 1_000_000) * RATE_GPT4O;
  const costClaude = (claudeTokens * multiplier / 1_000_000) * RATE_CLAUDE;
  const costGemini = (geminiTokens * multiplier / 1_000_000) * RATE_GEMINI;

  return {
    openai_gpt4o_tokens: gpt4oTokens,
    openai_detail_mode: detail,
    claude_3_5_tokens: claudeTokens,
    gemini_flash_tokens: geminiTokens,
    cost_per_10k_calls_usd: {
      gpt4o: Number(costGpt4o.toFixed(2)),
      claude_3_5_sonnet: Number(costClaude.toFixed(2)),
      gemini_1_5_flash: Number(costGemini.toFixed(4))
    }
  };
}

/**
 * Detailed valuation for /v1/vision/token-calc endpoint
 */
export function analyzeTokenBudget(width: number, height: number, detail: "low" | "high" = "high"): TokenCalcResponse {
  const { tokens: gpt4oTokens, tiles } = calculateOpenAIVisionTokens(width, height, detail);
  const claudeTokens = calculateClaudeTokens(width, height);
  const geminiTokens = calculateGeminiTokens();

  const totalPixels = width * height;
  const aspect = `${(width / Math.gcd(width, height)).toFixed(0)}:${(height / Math.gcd(width, height)).toFixed(0)}`;

  const RATE_GPT4O = 2.50;
  const RATE_CLAUDE = 3.00;
  const RATE_GEMINI = 0.075;

  return {
    dimensions: { width, height },
    aspect_ratio: aspect,
    total_pixels: totalPixels,
    tiles_count_512: tiles,
    openai_gpt4o_tokens: gpt4oTokens,
    claude_tokens: claudeTokens,
    gemini_tokens: geminiTokens,
    single_call_cost_usd: {
      gpt4o: Number(((gpt4oTokens / 1_000_000) * RATE_GPT4O).toFixed(6)),
      claude_3_5_sonnet: Number(((claudeTokens / 1_000_000) * RATE_CLAUDE).toFixed(6)),
      gemini_1_5_flash: Number(((geminiTokens / 1_000_000) * RATE_GEMINI).toFixed(6))
    },
    hundred_k_calls_cost_usd: {
      gpt4o: Number(((gpt4oTokens * 100000 / 1_000_000) * RATE_GPT4O).toFixed(2)),
      claude_3_5_sonnet: Number(((claudeTokens * 100000 / 1_000_000) * RATE_CLAUDE).toFixed(2)),
      gemini_1_5_flash: Number(((geminiTokens * 100000 / 1_000_000) * RATE_GEMINI).toFixed(2))
    },
    recommendation: tiles > 4 
      ? `High token consumption detected (${tiles} tiles = ${gpt4oTokens} tokens). Crop to region of interest to save up to ${(100 - (170 + 85) / gpt4oTokens * 100).toFixed(0)}% on API bills.`
      : "Optimized tile profile. Vision token density is within acceptable budget limits."
  };
}

// Greatest common divisor helper
declare global {
  interface Math {
    gcd(a: number, b: number): number;
  }
}
Math.gcd = function (a: number, b: number): number {
  return b ? Math.gcd(b, a % b) : Math.abs(a);
};
