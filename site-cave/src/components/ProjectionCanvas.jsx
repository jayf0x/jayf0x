import {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { devLog } from "../utils";

const TITLE = "phantom-lens";
const DESC =
  "A privacy-first camera tool that redacts faces in real time before footage leaves the device.";

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

// Internally manages an offscreen `mask` canvas with the dark silhouette.
const CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation";

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.crossOrigin = "anonymous";
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// Accepts `videoRef` and `isActive`. Creates internal `maskRef`.
const ProjectionCanvas = forwardRef(function ProjectionCanvas(
  { videoRef, isActive },
  ref,
) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  // Cached main canvas context to avoid repeated getContext calls.
  const ctxRef = useRef(null);

  // Mask object holds the offscreen canvas and its context.
  const maskObjRef = useRef({ canvas: null, ctx: null });

  // Cached text layout (static-ish) computed on resize.
  const layoutRef = useRef({ titleSize: null, descSize: null, lines: [] });

  // Cached draw parameters for mask scaling to avoid per-frame recalculation.
  const drawParamsRef = useRef({
    lastMaskW: 0,
    lastMaskH: 0,
    lastCanvasW: 0,
    lastCanvasH: 0,
    scale: 1,
    dw: 0,
    dh: 0,
    dx: 0,
    dy: 0,
  });

  // Async capture that uses toBlob -> FileReader to avoid blocking the main thread.
  const captureFrame = useCallback((quality = 0.8) => {
    const canvas = canvasRef.current;
    return new Promise((resolve) => {
      if (!canvas) {
        devLog("No canvas");
        return resolve(null);
      }
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            devLog("No blob for image");
            return resolve(null);
          }
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        },
        "image/jpeg",
        quality,
      );
    });
  }, []);

  useImperativeHandle(ref, () => ({ captureFrame }), [captureFrame]);

  // Manage the segmentation mask: load MediaPipe and draw into an offscreen mask canvas.
  useEffect(() => {
    // lazily create offscreen mask canvas and cache its ctx
    if (!maskObjRef.current.canvas) {
      const c = document.createElement("canvas");
      maskObjRef.current.canvas = c;
      maskObjRef.current.ctx = c.getContext("2d");
    }
    const activeRef = { current: false };
    let rafId;

    if (!isActive) {
      // clear mask when inactive
      const obj = maskObjRef.current;
      obj.ctx?.clearRect(0, 0, obj.canvas.width, obj.canvas.height);
      return;
    }

    activeRef.current = true;

    loadScript(`${CDN}/selfie_segmentation.js`).then(() => {
      if (!activeRef.current) return;

      const seg = new window.SelfieSegmentation({
        locateFile: (file) => `${CDN}/${file}`,
      });
      seg.setOptions({ modelSelection: 1 });

      seg.onResults((results) => {
        const obj = maskObjRef.current;
        const canvas = obj.canvas;
        const video = videoRef?.current;
        if (!canvas || !video || !results.segmentationMask) return;

        const w = video.videoWidth || 640;
        const h = video.videoHeight || 480;
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;

        // re-acquire context after size changes
        obj.ctx = canvas.getContext("2d");
        const ctx = obj.ctx;
        ctx.clearRect(0, 0, w, h);

        ctx.drawImage(results.segmentationMask, 0, 0, w, h);
        ctx.globalCompositeOperation = "source-in";
        ctx.fillStyle = "#111111fe";
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
      });

      const loop = async () => {
        if (!activeRef.current) return;
        if (videoRef.current?.readyState >= 2) {
          await seg.send({ image: videoRef.current });
        }
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    });

    return () => {
      activeRef.current = false;
      cancelAnimationFrame(rafId);
    };
  }, [isActive, videoRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // cache the drawing context
    ctxRef.current = canvas.getContext("2d");

    const resize = () => {
      const cw = window.innerWidth;
      const ch = window.innerHeight;
      canvas.width = cw;
      canvas.height = ch;

      // re-acquire ctx after size change (resizing clears state)
      ctxRef.current = canvas.getContext("2d");

      // compute text layout once per resize
      const ctx = ctxRef.current;
      const titleSize = Math.max(36, Math.min(72, cw * 0.07));
      const descSize = Math.max(14, Math.min(22, cw * 0.022));
      ctx.font = `400 ${descSize}px system-ui, sans-serif`;
      const maxW = Math.min(cw * 0.65, 640);
      const lines = wrapText(ctx, DESC, maxW);
      layoutRef.current = { titleSize, descSize, lines };
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const ctx = ctxRef.current;
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = "#f5f0e8";
      ctx.fillRect(0, 0, w, h);

      // Projected text (uses cached layout)
      ctx.save();
      ctx.filter = "blur(0.6px)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const { titleSize, descSize, lines } = layoutRef.current;
      ctx.font = `900 ${titleSize}px system-ui, sans-serif`;
      ctx.fillStyle = "#0a0a0a";
      ctx.fillText(TITLE, w / 2, h / 2 - titleSize * 0.9);

      ctx.font = `400 ${descSize}px system-ui, sans-serif`;
      ctx.fillStyle = "#1a1a1a";
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(
          lines[i],
          w / 2,
          h / 2 + titleSize * 0.4 + i * (descSize * 1.5),
        );
      }
      ctx.restore();

      // Shadow layer — segmentation silhouette only (no raw camera)
      const obj = maskObjRef.current;
      if (
        isActive &&
        obj &&
        obj.canvas &&
        obj.canvas.width > 0 &&
        obj.canvas.height > 0
      ) {
        const mask = obj.canvas;
        const dp = drawParamsRef.current;
        if (
          mask.width !== dp.lastMaskW ||
          mask.height !== dp.lastMaskH ||
          w !== dp.lastCanvasW ||
          h !== dp.lastCanvasH
        ) {
          const scale = Math.min(w / mask.width, h / mask.height);
          const dw = mask.width * scale;
          const dh = mask.height * scale;
          const dx = (w - dw) / 2;
          const dy = (h - dh) / 2;
          dp.lastMaskW = mask.width;
          dp.lastMaskH = mask.height;
          dp.lastCanvasW = w;
          dp.lastCanvasH = h;
          dp.scale = scale;
          dp.dw = dw;
          dp.dh = dh;
          dp.dx = dx;
          dp.dy = dy;
        }

        ctx.save();
        ctx.translate(dp.dx + dp.dw, dp.dy);
        ctx.scale(-1, 1); // mirror
        ctx.drawImage(mask, 0, 0, dp.dw, dp.dh);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [isActive, videoRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        width: "100vw",
        height: "100vh",
        position: "fixed",
        inset: 0,
      }}
    />
  );
});

export default ProjectionCanvas;
