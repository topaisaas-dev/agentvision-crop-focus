/**
 * AgentVision Crop & Focus API Types
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PercentageBox {
  x_pct: number;
  y_pct: number;
  width_pct: number;
  height_pct: number;
}

export type VisionCropPreset = 
  | "hero" 
  | "main_content" 
  | "pricing_table" 
  | "checkout_form" 
  | "navbar" 
  | "footer"
  | "center_square"
  | "mobile_viewport";

export interface VisionTokenCost {
  openai_gpt4o_tokens: number;
  openai_detail_mode: "low" | "high";
  claude_3_5_tokens: number;
  gemini_flash_tokens: number;
  cost_per_10k_calls_usd: {
    gpt4o: number;
    claude_3_5_sonnet: number;
    gemini_1_5_flash: number;
  };
}

export interface CropVisionRequest {
  image_url?: string;
  image_base64?: string;
  original_width?: number;
  original_height?: number;
  crop_box?: BoundingBox;
  crop_pct?: PercentageBox;
  preset?: VisionCropPreset;
  padding_px?: number;
  normalize_for_vision?: boolean;
  target_format?: "svg_clip" | "coordinates_only" | "data_url";
}

export interface CropVisionResponse {
  success: boolean;
  original_dimensions: { width: number; height: number };
  cropped_dimensions: { width: number; height: number };
  bounding_box: BoundingBox;
  token_savings: {
    original_tokens: VisionTokenCost;
    cropped_tokens: VisionTokenCost;
    tokens_saved: number;
    savings_percentage: number;
    estimated_dollars_saved_per_10k_calls: number;
  };
  output_format: string;
  preview_url_or_svg: string;
  execution_time_ms: number;
}

export interface TokenCalcRequest {
  width: number;
  height: number;
  detail?: "low" | "high";
}

export interface TokenCalcResponse {
  dimensions: { width: number; height: number };
  aspect_ratio: string;
  total_pixels: number;
  tiles_count_512: number;
  openai_gpt4o_tokens: number;
  claude_tokens: number;
  gemini_tokens: number;
  single_call_cost_usd: {
    gpt4o: number;
    claude_3_5_sonnet: number;
    gemini_1_5_flash: number;
  };
  hundred_k_calls_cost_usd: {
    gpt4o: number;
    claude_3_5_sonnet: number;
    gemini_1_5_flash: number;
  };
  recommendation: string;
}

export interface FocusSelectorRequest {
  html_snippet: string;
  selector: string;
  viewport?: { width: number; height: number };
}

export interface FocusSelectorResponse {
  selector_matched: string;
  target_element: string;
  estimated_bounding_box: BoundingBox;
  recommended_crop_parameters: PercentageBox;
  playwright_snippet: string;
  puppeteer_snippet: string;
}
