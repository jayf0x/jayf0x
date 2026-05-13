export const TITLE = "phantom-lens";
export const DESC =
  "A privacy-first camera tool that redacts faces in real time before footage leaves the device.";

// Gobo canvas: bright text on black — used as SpotLight map so text shape = projected light
export function buildGoboCanvas() {
  const W = 2048;
  const H = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const titleSize = Math.round(W * 0.07);
  const descSize = Math.round(W * 0.022);

  ctx.font = `400 ${descSize}px system-ui, sans-serif`;
  const maxW = Math.min(W * 0.65, 1400);
  const lines = wrapText(ctx, DESC, maxW);

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = `900 ${titleSize}px system-ui, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(TITLE, W / 2, H / 2 - titleSize * 0.9);

  ctx.font = `400 ${descSize}px system-ui, sans-serif`;
  ctx.fillStyle = "#bbbbbb";
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], W / 2, H / 2 + titleSize * 0.4 + i * (descSize * 1.5));
  }
  ctx.restore();

  return canvas;
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function buildTextCanvas() {
  const W = 2048;
  const H = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const titleSize = Math.round(W * 0.07);
  const descSize = Math.round(W * 0.022);

  ctx.font = `400 ${descSize}px system-ui, sans-serif`;
  const maxW = Math.min(W * 0.65, 1400);
  const lines = wrapText(ctx, DESC, maxW);

  ctx.fillStyle = "#f5f0e8";
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.filter = "blur(0.6px)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = `900 ${titleSize}px system-ui, sans-serif`;
  ctx.fillStyle = "#0a0a0a";
  ctx.fillText(TITLE, W / 2, H / 2 - titleSize * 0.9);

  ctx.font = `400 ${descSize}px system-ui, sans-serif`;
  ctx.fillStyle = "#1a1a1a";
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], W / 2, H / 2 + titleSize * 0.4 + i * (descSize * 1.5));
  }
  ctx.restore();

  return canvas;
}
