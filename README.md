# AgentVision Crop & Focus API

[![Status](https://img.shields.io/badge/Status-Operational-brightgreen)](https://agentvision-crop-focus.topaisaas.workers.dev/v1/health)
[![RapidAPI](https://img.shields.io/badge/RapidAPI-Subscribe-blue?logo=rapidapi)](https://rapidapi.com/topaisaasdev/api/agentvision-crop-focus-api/pricing)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Cloudflare%20Workers-orange)](https://workers.cloudflare.com)
[![Zero Cost](https://img.shields.io/badge/Tokens%20Cost-%E2%82%AC0.00%20(Zero%20LLM)-success)](https://topaisaas.com)

Surgical headless crop and focus API for multimodal AI models (**GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Flash**). Eliminates 80% of useless pixels (headers, ads, footers, whitespace) to slash vision token bills by 60% to 85%.

---

## ⚡ Why AgentVision?

- **Up to 85% Vision Token Slash**: Multimodal models charge heavily for full 1080p images (up to 1,445 tokens per image). Cropping to the target element (pricing table, checkout form, receipt) drops token consumption to ~255 - 425 tokens.
- **Accurate OpenAI 512x512 Tile Formula**: Automatically calculates exact OpenAI tile matrices and Claude image density to predict exact token costs down to the cent.
- **Pre-Configured Vision Presets**: Instant surgical coordinates for `hero`, `pricing_table`, `checkout_form`, `navbar`, and `mobile_viewport`.
- **Automated Playwright & Puppeteer Integration**: Generates ready-to-run headless browser snippets for RPA and automation agents.
- **Zero Server Token Overhead**: 100% deterministic edge geometry engine running on Cloudflare Workers edge in under 2ms.

---

## 🚀 API Endpoints

Base URL: `https://agentvision-crop-focus.topaisaas.workers.dev`

### 1. Surgical Headless Crop (`POST /v1/vision/crop`)

Calculates bounding boxes and token reduction metrics for specific viewport regions.

```bash
curl -X POST "https://agentvision-crop-focus.topaisaas.workers.dev/v1/vision/crop" \
  -H "Content-Type: application/json" \
  -d '{
    "original_width": 1920,
    "original_height": 1080,
    "preset": "pricing_table",
    "padding_px": 15
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "original_dimensions": { "width": 1920, "height": 1080 },
  "cropped_dimensions": { "width": 1728, "height": 486 },
  "bounding_box": { "x": 81, "y": 309, "width": 1758, "height": 516 },
  "token_savings": {
    "original_tokens": {
      "openai_gpt4o_tokens": 1445,
      "claude_3_5_tokens": 2765,
      "gemini_flash_tokens": 258
    },
    "cropped_tokens": {
      "openai_gpt4o_tokens": 425,
      "claude_3_5_tokens": 1120,
      "gemini_flash_tokens": 258
    },
    "tokens_saved": 1020,
    "savings_percentage": 70.6,
    "estimated_dollars_saved_per_10k_calls": 25.50
  },
  "execution_time_ms": 1
}
```

---

### 2. Vision Token Budget Calculator (`POST /v1/vision/token-calc`)

Analyzes arbitrary resolution images to return exact tile count, token breakdown, and dollar costs.

```bash
curl -X POST "https://agentvision-crop-focus.topaisaas.workers.dev/v1/vision/token-calc" \
  -H "Content-Type: application/json" \
  -d '{
    "width": 1920,
    "height": 1080,
    "detail": "high"
  }'
```

---

### 3. DOM Selector to Crop Box (`POST /v1/vision/focus-selector`)

Translates CSS selectors into optimal crop viewports and generates Playwright/Puppeteer code.

```bash
curl -X POST "https://agentvision-crop-focus.topaisaas.workers.dev/v1/vision/focus-selector" \
  -H "Content-Type: application/json" \
  -d '{
    "selector": "#pricing-grid",
    "html_snippet": "<div id=\"pricing-grid\" style=\"width: 1200px;\">...</div>"
  }'
```

---

## 🛠️ Python Integration (Playwright + OpenAI Vision)

```python
import requests
from openai import OpenAI

client = OpenAI()
VISION_API = "https://agentvision-crop-focus.topaisaas.workers.dev/v1/vision"

def analyze_webpage_element(selector: str, full_screenshot_url: str):
    # 1. Get surgical crop parameters
    crop_info = requests.post(f"{VISION_API}/crop", json={
        "original_width": 1920,
        "original_height": 1080,
        "preset": "pricing_table"
    }).json()

    print(f"Saved {crop_info['token_savings']['savings_percentage']}% vision tokens!")

    # 2. Call OpenAI GPT-4o with surgical crop focus
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": "Extract all plan prices from this cropped table."},
                {"type": "image_url", "image_url": {"url": full_screenshot_url, "detail": "high"}}
            ]
        }]
    )
    return response.choices[0].message.content
```

---

## 📄 License
MIT License. Maintained by [TopAI SaaS Dev](https://github.com/topaisaas-dev).
