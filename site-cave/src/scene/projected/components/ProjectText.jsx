import { useMemo, useEffect } from "react";
import * as THREE from "three";

export const ProjectText = ({ title, description }) => {
  const texture = useMemo(
    () => new THREE.CanvasTexture(buildGoboCanvas({ title, description })),
    [title, description],
  );
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh renderOrder={1}>
      <planeGeometry args={[2, 1]} />
      <meshBasicMaterial
        map={texture}
        blending={THREE.AdditiveBlending}
        depthTest={false}
        depthWrite={false}
        transparent
      />
    </mesh>
  );
};

// Gobo canvas: bright text on black — used as SpotLight map so text shape = projected light
function buildGoboCanvas(title, description) {
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
  const lines = wrapText(ctx, description, maxW);

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Glow pass: soft halo behind the text, widens the readable area when projected
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 80;
  ctx.font = `900 ${titleSize}px system-ui, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(title, W / 2, H / 2 - titleSize * 0.9);

  ctx.shadowBlur = 40;
  ctx.font = `400 ${descSize}px system-ui, sans-serif`;
  ctx.fillStyle = "#dddddd";
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(
      lines[i],
      W / 2,
      H / 2 + titleSize * 0.4 + i * (descSize * 1.5),
    );
  }

  // Sharp pass on top to keep edges crisp
  ctx.shadowBlur = 0;
  ctx.font = `900 ${titleSize}px system-ui, sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(title, W / 2, H / 2 - titleSize * 0.9);

  ctx.font = `400 ${descSize}px system-ui, sans-serif`;
  ctx.fillStyle = "#dddddd";
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(
      lines[i],
      W / 2,
      H / 2 + titleSize * 0.4 + i * (descSize * 1.5),
    );
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
