import test from 'node:test';
import assert from 'node:assert/strict';

function calculateOpenAIVisionTokens(width, height, detail = "high") {
  if (detail === "low") {
    return { tokens: 85, tiles: 0 };
  }
  let w = width;
  let h = height;

  if (w > 2048 || h > 2048) {
    const ratio = Math.min(2048 / w, 2048 / h);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);
  }

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

  const tilesX = Math.ceil(w / 512);
  const tilesY = Math.ceil(h / 512);
  const totalTiles = tilesX * tilesY;
  const totalTokens = 85 + (totalTiles * 170);

  return { tokens: totalTokens, tiles: totalTiles };
}

test('OpenAI Vision Low Detail is flat 85 tokens', () => {
  const res = calculateOpenAIVisionTokens(1920, 1080, "low");
  assert.equal(res.tokens, 85);
  assert.equal(res.tiles, 0);
});

test('OpenAI Vision High Detail scales and tiles properly', () => {
  const res = calculateOpenAIVisionTokens(1920, 1080, "high");
  assert.ok(res.tiles > 0);
  assert.ok(res.tokens > 500);
});

test('Crop coordinates stay strictly within viewport boundaries', () => {
  const origW = 1920;
  const origH = 1080;
  const p = { x_pct: 0.1, y_pct: 0.2, w_pct: 0.8, h_pct: 0.6 };
  const box = {
    x: Math.round(p.x_pct * origW),
    y: Math.round(p.y_pct * origH),
    width: Math.round(p.w_pct * origW),
    height: Math.round(p.h_pct * origH)
  };

  assert.ok(box.x >= 0 && box.x < origW);
  assert.ok(box.y >= 0 && box.y < origH);
  assert.ok(box.x + box.width <= origW);
  assert.ok(box.y + box.height <= origH);
});
