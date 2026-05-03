// Hyper optimized with the goal for true perfection!

// CPU:  flat Uint8Array grid, Canvas 2D direct rendering (no OffscreenCanvas)
// GPU:  WebGPU compute (no readback) + render pipeline on sibling canvas overlay

export interface ConwayConfig {
  targetCols?: number;
  stepMs?: number;
}

export interface ConwayControls {
  destroy: () => void;
  setPaused: (p: boolean) => void;
}

const COLORS_CSS_CONWAY = [
  "rgb(15,25,80)",
  "rgb(25,50,130)",
  "rgb(45,95,185)",
  "rgb(85,175,255)",
  "rgb(65,150,235)",
  "rgb(48,115,200)",
  "rgb(34,80,165)",
  "rgb(22,58,140)",
  "rgb(14,38,110)",
];

const COLORS_CSS_DAYNIGHT = [
  "rgb(255,245,220)", // 0 neighbors – bright edge/isolated
  "rgb(255,215,150)", // 1
  "rgb(255,180,70)",  // 2
  "rgb(245,135,25)",  // 3 – birth threshold
  "rgb(218,90,8)",    // 4
  "rgb(185,55,4)",    // 5
  "rgb(150,28,2)",    // 6
  "rgb(115,10,1)",    // 7
  "rgb(78,3,1)",      // 8 – deep interior, darkest
];

// ── WGSL: compute (one generation step) ─────────────────────────────────────
const buildComputeWGSL = (isConway: boolean) => /* wgsl */ `
  @group(0) @binding(0) var<storage, read>       cur  : array<u32>;
  @group(0) @binding(1) var<storage, read_write> nxt  : array<u32>;
  @group(0) @binding(2) var<storage, read_write> cnt  : array<u32>;
  @group(0) @binding(3) var<uniform>             dims : vec2u;

  @compute @workgroup_size(8, 8)
  fn main(@builtin(global_invocation_id) id: vec3u) {
    let x = id.x; let y = id.y;
    if (x >= dims.x || y >= dims.y) { return; }
    var n: u32 = 0u;
    for (var dy: i32 = -1; dy <= 1; dy++) {
      for (var dx: i32 = -1; dx <= 1; dx++) {
        if (dx == 0 && dy == 0) { continue; }
        let nx = i32(x) + dx; let ny = i32(y) + dy;
        if (nx < 0 || nx >= i32(dims.x) || ny < 0 || ny >= i32(dims.y)) { continue; }
        n += cur[u32(ny) * dims.x + u32(nx)];
      }
    }
    cnt[y * dims.x + x] = n;
    let alive = cur[y * dims.x + x];
${
  isConway
    ? `
    nxt[y * dims.x + x] = select(
      select(0u, 1u, n == 3u),
      select(0u, 1u, n == 2u || n == 3u),
      alive == 1u
    );
`
    : `
    let birth   = (n == 3u || n == 6u || n == 7u || n == 8u);
    let survive = (n == 3u || n == 4u || n == 6u || n == 7u || n == 8u);
    nxt[y * dims.x + x] = select(
      select(0u, 1u, birth),
      select(0u, 1u, survive),
      alive == 1u
    );
`
}
  }
`;

// ── WGSL: render (fullscreen triangle, colors cells by neighbor count) ───────
// Uses premultiplied alpha: (r*a, g*a, b*a, a)
const buildRenderWGSL = (isConway: boolean) => /* wgsl */ `
  const CELL_COLORS: array<vec3f, 9> = array<vec3f, 9>(
${
  isConway
    ? `
    vec3f( 15.0,  25.0,  80.0),
    vec3f( 25.0,  50.0, 130.0),
    vec3f( 45.0,  95.0, 185.0),
    vec3f( 85.0, 175.0, 255.0),
    vec3f( 65.0, 150.0, 235.0),
    vec3f( 48.0, 115.0, 200.0),
    vec3f( 34.0,  80.0, 165.0),
    vec3f( 22.0,  58.0, 140.0),
    vec3f( 14.0,  38.0, 110.0),
`
    : `
    vec3f(255.0, 245.0, 220.0),
    vec3f(255.0, 215.0, 150.0),
    vec3f(255.0, 180.0,  70.0),
    vec3f(245.0, 135.0,  25.0),
    vec3f(218.0,  90.0,   8.0),
    vec3f(185.0,  55.0,   4.0),
    vec3f(150.0,  28.0,   2.0),
    vec3f(115.0,  10.0,   1.0),
    vec3f( 78.0,   3.0,   1.0),
`
}
  );

  struct P {
    cols: u32, rows: u32, cell: u32,
    hx: i32, hy: i32,
    _p0: u32, _p1: u32, _p2: u32,
  }

  @group(0) @binding(0) var<storage, read> grid : array<u32>;
  @group(0) @binding(1) var<storage, read> cnt  : array<u32>;
  @group(0) @binding(2) var<uniform>       p    : P;

  @vertex
  fn vs(@builtin(vertex_index) vi: u32) -> @builtin(position) vec4f {
    var pos = array<vec2f, 3>(vec2f(-1.0,-1.0), vec2f(3.0,-1.0), vec2f(-1.0,3.0));
    return vec4f(pos[vi], 0.0, 1.0);
  }

  @fragment
  fn fs(@builtin(position) fc: vec4f) -> @location(0) vec4f {
    let px = u32(fc.x); let py = u32(fc.y);
    let cx = px / p.cell; let cy = py / p.cell;
    if (cx >= p.cols || cy >= p.rows) { return vec4f(0.0); }

    // 1px gap on each side (matches fillRect cell+1, size cell-2)
    let lx = px % p.cell; let ly = py % p.cell;
    if (lx == 0u || lx >= p.cell - 1u || ly == 0u || ly >= p.cell - 1u) {
      return vec4f(0.0);
    }

    let i = cy * p.cols + cx;

    if (grid[i] == 0u) {
      if (i32(cx) == p.hx && i32(cy) == p.hy) {
        // hover highlight, premultiplied: rgb * 0.12
        return vec4f(0.094, 0.104, 0.12, 0.12);
      }
      return vec4f(0.0);
    }

    let c = CELL_COLORS[min(cnt[i], 8u)] / 255.0;
    return vec4f(c, 1.0);  // alpha=1, no premul needed
  }
`;

// ── Known patterns ────────────────────────────────────────────────────────────
// '.' = dead, 'O' = alive  (ASCII art from Conway.txt / DayNight.txt)
const CONWAY_PATTERNS: string[][] = [
  // Glider (diagonal c/4, period 4)
  [".O.", "O..", "OOO"],
  // LWSS (c/2, period 4)
  [".O..O", "O....", "O...O", "OOOO."],
  // MWSS (c/2, period 4)
  ["...O..", ".O...O", "O.....", "O....O", "OOOOO."],
  // HWSS (c/2, period 4)
  ["...OO..", ".O....O", "O......", "O.....O", "OOOOOO."],
  // Schick engine tagalong (c/2, period 12) — two LWSS needed to drive it,
  // but placed solo it evolves interestingly
  ["OOOO.....", "O...O....", "O........", ".O..O..OO", "......OOO",
   ".O..O..OO", "O........", "O...O....", "OOOO....."],
];

const DAYNIGHT_PATTERNS: string[][] = [
  // Rocket predecessor — spontaneously generates the period-40 rocket (Fig 3)
  [".OO.....", "O.OO....", "OOOOOOOO", "O.OO....", ".OO....."],
  // Two-rockets predecessor — generates two rockets in opposite directions (Fig 4)
  ["..O...", ".OOOOO", "OOOOO.", ".OOOOO", "..O..."],
  // Period-32 c/2 spaceship (Fig 9)
  ["...O....", ".OOO....", "O.OOO.O.", "OOOOO.OO", "O.OOO.O.", ".OOO....", "...O...."],
  // Snail — period-14 c/7 spaceship (Fig 11)
  ["..O..", "O.OO.", "OOOOO", "O.OO.", "..O.."],
  // Butterfly — diagonal period-3 c/3 spaceship (Fig 10)
  [".OOO.", "O.OOO", "OO...", "OO...", ".O..."],
  // Period-2 even-symmetry c/2 spaceship (Fig 5)
  ["....OOO..", "..O.OO...", ".OOOOOO.O", "OOOOOOOO.", "OOOOOOOO.", ".OOOOOO.O", "..O.OO...", "....OOO.."],
];

export function createConwayEngine(
  canvas: HTMLCanvasElement,
  isConway: boolean = true,
  config: ConwayConfig = {},
): ConwayControls {
  const { targetCols = 80, stepMs = 240 } = config;

  const COLORS_CSS = isConway ? COLORS_CSS_CONWAY : COLORS_CSS_DAYNIGHT;
  const WGSL_COMPUTE = buildComputeWGSL(isConway);
  const WGSL_RENDER = buildRenderWGSL(isConway);

  // ── shared grid state ─────────────────────────────────────────────────────
  let cols = 0,
    rows = 0,
    cell = 0,
    total = 0;
  let current = new Uint8Array(0);
  let scratch = new Uint8Array(0);
  let counts = new Uint8Array(0);
  let paused = false,
    lastStep = 0,
    raf = 0;
  let hovered: { x: number; y: number } | null = null;
  let mode: "cpu" | "gpu" = "cpu";
  let destroyed = false;

  const allocGrid = (w: number, h: number) => {
    cell = Math.max(4, Math.floor(w / targetCols));
    cols = Math.floor(w / cell);
    rows = Math.floor(h / cell);
    total = cols * rows;
    current = new Uint8Array(total);
    scratch = new Uint8Array(total);
    counts = new Uint8Array(total);
  };

  const placePattern = (pattern: string[], ox: number, oy: number) => {
    for (let r = 0; r < pattern.length; r++) {
      for (let c = 0; c < pattern[r].length; c++) {
        if (pattern[r][c] === "O") {
          const gx = ox + c, gy = oy + r;
          if (gx >= 0 && gx < cols && gy >= 0 && gy < rows)
            current[gy * cols + gx] = 1;
        }
      }
    }
  };

  const seed = () => {
    current.fill(0);
    const patterns = isConway ? CONWAY_PATTERNS : DAYNIGHT_PATTERNS;
    const margin = 5;
    // Scale count to grid area, minimum 6
    const count = Math.max(6, Math.round((cols * rows) / 350));
    for (let i = 0; i < count; i++) {
      const p = patterns[i % patterns.length];
      const pw = Math.max(...p.map((r) => r.length));
      const ph = p.length;
      const maxX = cols - margin - pw;
      const maxY = rows - margin - ph;
      if (maxX <= margin || maxY <= margin) continue;
      const x = margin + Math.floor(Math.random() * (maxX - margin));
      const y = margin + Math.floor(Math.random() * (maxY - margin));
      placePattern(p, x, y);
    }
  };

  // ── CPU step ──────────────────────────────────────────────────────────────
  const cpuStep = () => {
    counts.fill(0);
    for (let y = 0; y < rows; y++) {
      const row = y * cols;
      const rowU = y > 0 ? (y - 1) * cols : -1;
      const rowD = y < rows - 1 ? (y + 1) * cols : -1;
      for (let x = 0; x < cols; x++) {
        if (current[row + x] === 0) continue;
        const xL = x > 0 ? x - 1 : -1;
        const xR = x < cols - 1 ? x + 1 : -1;
        if (rowU >= 0) {
          if (xL >= 0) counts[rowU + xL]++;
          counts[rowU + x]++;
          if (xR >= 0) counts[rowU + xR]++;
        }
        if (xL >= 0) counts[row + xL]++;
        if (xR >= 0) counts[row + xR]++;
        if (rowD >= 0) {
          if (xL >= 0) counts[rowD + xL]++;
          counts[rowD + x]++;
          if (xR >= 0) counts[rowD + xR]++;
        }
      }
    }
    for (let i = 0; i < total; i++) {
      const c = counts[i];

      if (isConway) {
        scratch[i] = current[i]
          ? c === 2 || c === 3
            ? 1
            : 0
          : c === 3
            ? 1
            : 0;
      } else {
        scratch[i] = current[i]
          ? c === 3 || c === 4 || c === 6 || c === 7 || c === 8
            ? 1
            : 0
          : c === 3 || c === 6 || c === 7 || c === 8
            ? 1
            : 0;
      }
    }
    const tmp = current;
    current = scratch;
    scratch = tmp;
  };

  // ── CPU render ────────────────────────────────────────────────────────────
  const ctx2d = canvas.getContext("2d", { willReadFrequently: false })!;
  ctx2d.imageSmoothingEnabled = false;
  const buckets: number[][] = Array.from({ length: 9 }, () => []);

  const cpuDraw = () => {
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        if (current[i] === 0) continue;
        const nc = counts[i];
        buckets[nc < 9 ? nc : 8].push(x, y);
      }
    }
    for (let ci = 0; ci < 9; ci++) {
      const b = buckets[ci];
      if (b.length === 0) continue;
      ctx2d.fillStyle = COLORS_CSS[ci];
      for (let j = 0; j < b.length; j += 2)
        ctx2d.fillRect(
          b[j] * cell + 1,
          b[j + 1] * cell + 1,
          cell - 2,
          cell - 2,
        );
      b.length = 0;
    }
    if (hovered) {
      const { x, y } = hovered;
      if (
        x >= 0 &&
        x < cols &&
        y >= 0 &&
        y < rows &&
        current[y * cols + x] === 0
      ) {
        ctx2d.fillStyle = "rgba(200,220,255,0.12)";
        ctx2d.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
      }
    }
  };

  const cpuLoop = (now: number) => {
    if (mode === "gpu") return;
    if (!paused && now - lastStep > stepMs) {
      lastStep = now;
      cpuStep();
    }
    cpuDraw();
    raf = requestAnimationFrame(cpuLoop);
  };

  // ── WebGPU ────────────────────────────────────────────────────────────────
  let gpuDevice: GPUDevice | null = null;
  let gpuCanvas: HTMLCanvasElement | null = null;
  let gpuCtx: GPUCanvasContext | null = null;
  let gpuFormat: GPUTextureFormat = "bgra8unorm";

  let gpuBufA: GPUBuffer | null = null; // grid state A (ping)
  let gpuBufB: GPUBuffer | null = null; // grid state B (pong)
  let gpuBufCnt: GPUBuffer | null = null; // neighbor counts
  let gpuBufDims: GPUBuffer | null = null;
  let gpuBufParams: GPUBuffer | null = null;

  let computePipeline: GPUComputePipeline | null = null;
  let renderPipeline: GPURenderPipeline | null = null;
  let computeBG_AB: GPUBindGroup | null = null;
  let computeBG_BA: GPUBindGroup | null = null;
  let renderBG_A: GPUBindGroup | null = null;
  let renderBG_B: GPUBindGroup | null = null;
  let gpuFlip = false; // false=A is current, true=B is current

  // Reused render-params buffer: cols, rows, cell, hoverX, hoverY + 3× padding
  const rpBuf = new ArrayBuffer(32);
  const rpU32 = new Uint32Array(rpBuf);
  const rpI32 = new Int32Array(rpBuf);

  const initGPUBuffers = () => {
    if (!gpuDevice || !computePipeline || !renderPipeline || total === 0)
      return;
    const byteLen = total * 4;
    const mk = (usage: number) =>
      gpuDevice!.createBuffer({ size: byteLen, usage });

    gpuBufA?.destroy();
    gpuBufB?.destroy();
    gpuBufCnt?.destroy();
    gpuBufDims?.destroy();
    gpuBufParams?.destroy();

    gpuBufA = mk(GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
    gpuBufB = mk(GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST);
    gpuBufCnt = mk(GPUBufferUsage.STORAGE);
    gpuBufDims = gpuDevice.createBuffer({
      size: 8,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    gpuBufParams = gpuDevice.createBuffer({
      size: 32,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Upload dims and initial state
    gpuDevice.queue.writeBuffer(gpuBufDims, 0, new Uint32Array([cols, rows]));
    const u32 = new Uint32Array(current);
    gpuDevice.queue.writeBuffer(gpuBufA, 0, u32);
    gpuFlip = false;

    const cLayout = computePipeline.getBindGroupLayout(0);
    const rLayout = renderPipeline.getBindGroupLayout(0);
    const mkCBG = (a: GPUBuffer, b: GPUBuffer) =>
      gpuDevice!.createBindGroup({
        layout: cLayout,
        entries: [
          { binding: 0, resource: { buffer: a } },
          { binding: 1, resource: { buffer: b } },
          { binding: 2, resource: { buffer: gpuBufCnt! } },
          { binding: 3, resource: { buffer: gpuBufDims! } },
        ],
      });
    computeBG_AB = mkCBG(gpuBufA, gpuBufB);
    computeBG_BA = mkCBG(gpuBufB, gpuBufA);

    const mkRBG = (gridBuf: GPUBuffer) =>
      gpuDevice!.createBindGroup({
        layout: rLayout,
        entries: [
          { binding: 0, resource: { buffer: gridBuf } },
          { binding: 1, resource: { buffer: gpuBufCnt! } },
          { binding: 2, resource: { buffer: gpuBufParams! } },
        ],
      });
    renderBG_A = mkRBG(gpuBufA);
    renderBG_B = mkRBG(gpuBufB);
  };

  const configureGPUCanvas = () => {
    if (!gpuCanvas || !gpuDevice || !gpuCtx) return;
    gpuCtx.configure({
      device: gpuDevice,
      format: gpuFormat,
      alphaMode: "premultiplied",
    });
  };

  const initGPU = async () => {
    if (!navigator.gpu) return;
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter || destroyed) return;
      gpuDevice = await adapter.requestDevice();
      if (destroyed) {
        gpuDevice.destroy();
        gpuDevice = null;
        return;
      }
      gpuFormat = navigator.gpu.getPreferredCanvasFormat();

      // Overlay canvas — pointer-events:none so mouse falls through to CPU canvas
      gpuCanvas = document.createElement("canvas");
      gpuCanvas.style.cssText =
        "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:none";
      gpuCanvas.width = canvas.width;
      gpuCanvas.height = canvas.height;
      // Insert after CPU canvas but before button overlay (DOM order = z-order)
      canvas.parentElement!.insertBefore(gpuCanvas, canvas.nextSibling);

      gpuCtx = gpuCanvas.getContext("webgpu") as GPUCanvasContext | null;
      if (!gpuCtx) throw new Error("no webgpu context");
      configureGPUCanvas();

      const computeModule = gpuDevice.createShaderModule({
        code: WGSL_COMPUTE,
      });
      const renderModule = gpuDevice.createShaderModule({ code: WGSL_RENDER });
      computePipeline = gpuDevice.createComputePipeline({
        layout: "auto",
        compute: { module: computeModule, entryPoint: "main" },
      });
      renderPipeline = gpuDevice.createRenderPipeline({
        layout: "auto",
        vertex: { module: renderModule, entryPoint: "vs" },
        fragment: {
          module: renderModule,
          entryPoint: "fs",
          targets: [{ format: gpuFormat }],
        },
        primitive: { topology: "triangle-list" },
      });

      initGPUBuffers();

      cancelAnimationFrame(raf);
      ctx2d.clearRect(0, 0, canvas.width, canvas.height); // CPU canvas stays visible for events; clearRect = transparent
      gpuCanvas.style.display = "block";
      mode = "gpu";
      lastStep = performance.now();
      raf = requestAnimationFrame(gpuLoop);
    } catch {
      gpuCanvas?.remove();
      gpuCanvas = null;
      gpuDevice?.destroy();
      gpuDevice = null;
    }
  };

  const gpuLoop = (now: number) => {
    if (
      mode !== "gpu" ||
      !gpuDevice ||
      !gpuCtx ||
      !computePipeline ||
      !renderPipeline ||
      !computeBG_AB ||
      !computeBG_BA ||
      !renderBG_A ||
      !renderBG_B ||
      !gpuBufParams
    ) {
      raf = requestAnimationFrame(gpuLoop);
      return;
    }

    const shouldStep = !paused && now - lastStep > stepMs;
    if (shouldStep) lastStep = now;

    // Update hover uniform
    rpU32[0] = cols;
    rpU32[1] = rows;
    rpU32[2] = cell;
    rpI32[3] = hovered ? hovered.x : -1;
    rpI32[4] = hovered ? hovered.y : -1;
    gpuDevice.queue.writeBuffer(gpuBufParams, 0, rpBuf);

    const enc = gpuDevice.createCommandEncoder();

    if (shouldStep) {
      const pass = enc.beginComputePass();
      pass.setPipeline(computePipeline);
      pass.setBindGroup(0, gpuFlip ? computeBG_BA : computeBG_AB);
      pass.dispatchWorkgroups(Math.ceil(cols / 8), Math.ceil(rows / 8));
      pass.end();
      gpuFlip = !gpuFlip;
    }

    // Render: read from current buffer (A when flip=false, B when flip=true)
    const renderBG = gpuFlip ? renderBG_B : renderBG_A;
    const renderPass = enc.beginRenderPass({
      colorAttachments: [
        {
          view: gpuCtx.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });
    renderPass.setPipeline(renderPipeline);
    renderPass.setBindGroup(0, renderBG);
    renderPass.draw(3);
    renderPass.end();

    gpuDevice.queue.submit([enc.finish()]);
    raf = requestAnimationFrame(gpuLoop);
  };

  // ── resize ────────────────────────────────────────────────────────────────
  const onResize = (w = canvas.clientWidth, h = canvas.clientHeight) => {
    const width = w || window.innerWidth;
    const height = h || window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    if (gpuCanvas) {
      gpuCanvas.width = width;
      gpuCanvas.height = height;
      configureGPUCanvas();
    }
    allocGrid(width, height);
    seed();
    if (gpuDevice) initGPUBuffers();
  };

  const ro = new ResizeObserver((entries) => {
    const r = entries[0]?.contentRect;
    if (r) onResize(r.width, r.height);
  });

  // ── events ────────────────────────────────────────────────────────────────
  const onKey = (e: KeyboardEvent) => {
    if (e.code === "Space") {
      e.preventDefault();
      paused = !paused;
    }
  };
  const onMove = (e: MouseEvent) => {
    hovered = {
      x: Math.floor(e.offsetX / cell),
      y: Math.floor(e.offsetY / cell),
    };
  };
  const onLeave = () => {
    hovered = null;
  };
  const onDown = (e: MouseEvent) => {
    const cx = canvas.width / 2,
      cy = canvas.height / 2;
    const dx = e.offsetX - cx,
      dy = e.offsetY - cy;
    if (dx * dx + dy * dy < 60 * 60) return;
    const x = Math.floor(e.offsetX / cell),
      y = Math.floor(e.offsetY / cell);
    if (x < 0 || x >= cols || y < 0 || y >= rows) return;
    const i = y * cols + x;
    current[i] = 1; // keep CPU array consistent (used on resize re-seed)
    if (gpuDevice) {
      // Write single cell directly to current GPU buffer — no full upload needed
      const curBuf = gpuFlip ? gpuBufB : gpuBufA;
      if (curBuf)
        gpuDevice.queue.writeBuffer(curBuf, i * 4, new Uint32Array([1]));
    }
  };

  // ── init ──────────────────────────────────────────────────────────────────
  onResize();
  ro.observe(canvas);
  window.addEventListener("keydown", onKey);
  canvas.addEventListener("mousedown", onDown);
  canvas.addEventListener("mousemove", onMove);
  canvas.addEventListener("mouseleave", onLeave);
  raf = requestAnimationFrame(cpuLoop);
  initGPU(); // async — switches to GPU loop when ready

  const destroy = () => {
    destroyed = true;
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.removeEventListener("keydown", onKey);
    canvas.removeEventListener("mousedown", onDown);
    canvas.removeEventListener("mousemove", onMove);
    canvas.removeEventListener("mouseleave", onLeave);
    gpuCanvas?.remove();
    gpuBufA?.destroy();
    gpuBufB?.destroy();
    gpuBufCnt?.destroy();
    gpuBufDims?.destroy();
    gpuBufParams?.destroy();
    gpuDevice?.destroy();
  };

  return {
    destroy,
    setPaused: (p: boolean) => { paused = p; },
  };
}
