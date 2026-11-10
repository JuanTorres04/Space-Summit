import { useEffect, useRef } from "react";

interface TrailCanvasProps {
  progress: number;
  elevationM: number;
}

type Rgb = [number, number, number];

interface Projected {
  x: number;
  y: number;
  p: number;
}

interface Row {
  y: number;
  cx: number;
  hw: number;
  world: number;
}

interface Star {
  x: number;
  y: number;
  r: number;
}

interface Nebula {
  x: number;
  y: number;
  r: number;
  rgb: string;
}

const WORLD_LENGTH = 600;
const DEPTH_SCALE = 6; 
const PLAYER_P = 0.82; 
const MIN_P = 0.03;
const EASING = 0.07; 
const ROW_STEP = 3; 
const STAR_COUNT = 140;
const SPEED_LINES = 34;
const DUST_COUNT = 70;
const DEBRIS_COUNT = 70;
const CRYSTAL_SPACING = 14;
const ROCK_SPACING = 9;
const DEBRIS_COLORS = ["#5ef2ff", "#ffb347", "#8a92c8"];
const NEBULAE: Nebula[] = [
  { x: 0.22, y: 0.3, r: 0.55, rgb: "130, 80, 255" },
  { x: 0.78, y: 0.2, r: 0.5, rgb: "0, 190, 255" },
  { x: 0.5, y: 0.55, r: 0.45, rgb: "255, 80, 160" },
];

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, v: number): number => {
  const x = clamp((v - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
};

const mix = (a: Rgb, b: Rgb, t: number): string =>
  `rgb(${Math.round(lerp(a[0], b[0], t))}, ${Math.round(lerp(a[1], b[1], t))}, ${Math.round(lerp(a[2], b[2], t))})`;

// repeatable "random" number from an index, so objects stay put as we pass them
const hash = (n: number): number => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// winding shape of the trail so how far left or right it sits at each distance
const curve = (w: number): number =>
  Math.sin(w / 48) + Math.sin(w / 19 + 1.3) * 0.45;

// heartbeat trace, p runs from 0 to 1
const ecg = (p: number): number => {
  if (p < 0.06) return (-p / 0.06) * 14;
  if (p < 0.12) return -14 + ((p - 0.06) / 0.06) * 26;
  if (p < 0.18) return 12 - ((p - 0.12) / 0.06) * 12;
  return Math.sin(p * 20) * 1.2;
};

export function TrailCanvas({ progress, elevationM }: TrailCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progress);
  const elevationRef = useRef(elevationM);

  // keep the animation loop reading the latest props without restarting it
  useEffect(() => {
    progressRef.current = progress;
    elevationRef.current = elevationM;
  }, [progress, elevationM]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.4 + 0.3,
    }));

    let width = 0;
    let height = 0;
    let current = progressRef.current / 100;
    let speedVis = 0;
    let runPhase = 0;
    let crossStart: number | null = null;
    let frame = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const quad = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      x3: number,
      y3: number,
      x4: number,
      y4: number,
    ) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.lineTo(x4, y4);
      ctx.closePath();
      ctx.fill();
    };

    // rounded rectangle path
    const rrect = (
      x: number,
      y: number,
      w: number,
      h: number,
      radius: number,
    ) => {
      const r = Math.min(radius, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    // interstellar themed black hole
    const drawBlackHole = (cx: number, cy: number, r: number, time: number) => {
      const rx = r * 2.5;
      const ry = r * 0.5;
      const pulse = 0.88 + 0.12 * Math.sin(time / 380);

      const glowR = r * 3.4;
      const glow = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, glowR);
      glow.addColorStop(0, `rgba(255, 150, 70, ${0.45 * pulse})`);
      glow.addColorStop(1, "rgba(255, 120, 40, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(cx - glowR, cy - glowR, glowR * 2, glowR * 2);

      const disk = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
      disk.addColorStop(0, "rgba(255, 110, 40, 0)");
      disk.addColorStop(0.12, "#ff9a3c");
      disk.addColorStop(0.35, "#ffe2b0");
      disk.addColorStop(0.5, "#fff6e0");
      disk.addColorStop(0.65, "#ffd08a");
      disk.addColorStop(0.88, "#ff7a2a");
      disk.addColorStop(1, "rgba(255, 100, 40, 0)");
      const diskWidth = Math.max(2, r * 0.2);

      ctx.shadowColor = "#ff9a3c";
      ctx.shadowBlur = 18;

      // back half of the disk, which passes behind the hole
      ctx.strokeStyle = disk;
      ctx.lineWidth = diskWidth;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, Math.PI * 2);
      ctx.stroke();

      // light bent around the hole
      const halo = ctx.createLinearGradient(0, cy - r * 1.2, 0, cy + r * 1.2);
      halo.addColorStop(0, "#fff1d6");
      halo.addColorStop(0.5, "#ff9a3c");
      halo.addColorStop(1, "#ffd9a0");
      ctx.strokeStyle = halo;
      ctx.lineWidth = Math.max(1.5, r * 0.07);
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.07, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // shadows
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // front half of the disk, which crosses in front of the hole
      ctx.shadowColor = "#ff9a3c";
      ctx.shadowBlur = 18;
      ctx.strokeStyle = disk;
      ctx.lineWidth = diskWidth;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI);
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    // ringed planet
    const drawPlanet = (cx: number, cy: number, r: number, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(cx, cy);
      ctx.rotate(-0.35);
      ctx.strokeStyle = "rgba(255, 220, 170, 0.5)";
      ctx.lineWidth = r * 0.16;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.9, r * 0.45, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
      const body = ctx.createRadialGradient(
        -r * 0.35,
        -r * 0.35,
        r * 0.1,
        0,
        0,
        r,
      );
      body.addColorStop(0, "#ffd9a8");
      body.addColorStop(0.6, "#c9703f");
      body.addColorStop(1, "#4a1f2e");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 220, 170, 0.8)";
      ctx.lineWidth = r * 0.16;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.9, r * 0.45, 0, 0, Math.PI);
      ctx.stroke();
      ctx.restore();
    };

    // drifting nebula clouds
    const drawNebula = (alpha: number, time: number, yMax: number) => {
      NEBULAE.forEach((n, i) => {
        const x = (n.x + Math.sin(time / 9000 + i) * 0.02) * width;
        const y = n.y * yMax;
        const r = n.r * width * 0.5;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${n.rgb}, ${(0.22 * alpha).toFixed(3)})`);
        g.addColorStop(1, `rgba(${n.rgb}, 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      });
    };

    // jagged ridge line along the horizon
    const drawMountains = (
      base: number,
      shift: number,
      amp: number,
      color: string,
      seed: number,
    ) => {
      const first = Math.floor((-60 + shift) / 24);
      const last = Math.ceil((width + 60 + shift) / 24);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(first * 24 - shift, base + 2);
      for (let k = first; k <= last; k++) {
        const y = base - hash(k + seed) * amp - Math.sin(k * 0.17) * amp * 0.35;
        ctx.lineTo(k * 24 - shift, y);
      }
      ctx.lineTo(last * 24 - shift, base + 2);
      ctx.closePath();
      ctx.fill();
    };

    const panel = (x: number, y: number, w: number, h: number) => {
      ctx.fillStyle = "rgba(10, 25, 50, 0.35)";
      ctx.strokeStyle = "rgba(94, 242, 255, 0.4)";
      ctx.lineWidth = 1;
      rrect(x, y, w, h, 8);
      ctx.fill();
      ctx.stroke();
    };

    const draw = (time: number) => {
      const target = clamp(progressRef.current / 100, 0, 1);
      const previous = current;
      current = reduceMotion ? target : current + (target - current) * EASING;
      const t = current;
      const d = t * WORLD_LENGTH;
      const elevation = elevationRef.current;
      const delta = (current - previous) * WORLD_LENGTH;
      speedVis = reduceMotion ? 0 : lerp(speedVis, clamp(delta * 4, 0, 1), 0.2);
      runPhase += speedVis * 0.4;

      // reaching the end starts the finale
      if (t < 0.9) crossStart = null;
      else if (crossStart === null && t > 0.985) crossStart = time;
      const c = crossStart === null ? 0 : (time - crossStart) / 1000;
      const grow = Math.pow(clamp(c / 2.4, 0, 1), 3);
      const fade = clamp(c / 1.3, 0, 1);

      const minDim = Math.min(width, height);
      const diag = Math.hypot(width, height);
      const horizonY = height * 0.4;
      const span = height - horizonY;
      const vpX = width / 2;
      const roadBase = Math.min(width, height * 1.1) * 0.32;
      const lateral = roadBase * 1.6;
      const aheadPlayer = DEPTH_SCALE * (1 / PLAYER_P - 1);
      const curveHere = curve(d);

      // black hole waits at the end of the trail and grows as we approach
      const pull = clamp((t - 0.55) / 0.45, 0, 1);
      const pullS = pull * pull * (3 - 2 * pull);
      const holeR = minDim * (0.05 + 0.5 * t * t) * (1 + 2.6 * grow);
      const holeX = vpX;
      const holeY = lerp(horizonY - minDim * 0.12, horizonY, t);

      // helmet geometry
      const mx = width * 0.035;
      const my = height * 0.05;
      const mb = height * 0.085;
      const ww = width - mx * 2;
      const wh = height - my - mb;
      const wr = Math.min(ww, wh) * 0.2;
      const addWindow = () => {
        ctx.moveTo(mx + wr, my);
        ctx.arcTo(mx + ww, my, mx + ww, my + wh, wr);
        ctx.arcTo(mx + ww, my + wh, mx, my + wh, wr);
        ctx.arcTo(mx, my + wh, mx, my, wr);
        ctx.arcTo(mx, my, mx + ww, my, wr);
        ctx.closePath();
      };

      // places objects at a distance along the trail and a lane across it
      const project = (worldDist: number, lane: number): Projected | null => {
        const ahead = worldDist - d + aheadPlayer;
        const p = 1 / (1 + ahead / DEPTH_SCALE);
        if (!Number.isFinite(p) || p < MIN_P || p > 1.2) return null;
        const bend =
          (curve(clamp(worldDist, 0, WORLD_LENGTH)) - curveHere) * lateral * p;
        return {
          x: vpX + bend + lane * roadBase * p,
          y: horizonY + p * span,
          p,
        };
      };

      // the whole helmet rumbles during the pull and the collapse
      const quake = reduceMotion
        ? 0
        : clamp(c / 1.2, 0, 1) * (1 - smooth(4.6, 5.4, c)) + 0.12 * pullS;
      ctx.save();
      ctx.translate(
        Math.sin(time / 23) * quake * 7,
        Math.cos(time / 29) * quake * 7,
      );

      // camera bob while running and a zoom toward the black hole near the end
      const bobX = Math.sin(runPhase * 0.5) * speedVis * 4;
      const bobY = Math.abs(Math.sin(runPhase)) * speedVis * 5;
      const zoom = 1 + 0.25 * pullS + 1.2 * grow;
      ctx.save();
      ctx.translate(bobX, bobY);
      ctx.translate(holeX, holeY);
      ctx.scale(zoom, zoom);
      ctx.translate(-holeX, -holeY);

      // sky darkens into space as we climb
      const sky = ctx.createLinearGradient(0, 0, 0, horizonY);
      sky.addColorStop(0, mix([22, 26, 64], [2, 3, 10], t));
      sky.addColorStop(1, mix([150, 90, 120], [14, 18, 50], t));
      ctx.fillStyle = sky;
      ctx.fillRect(-60, -60, width + 120, horizonY + 60);

      drawNebula(0.35 + 0.65 * t, time, horizonY);

      // stars brighten get dragged toward the black hole and streak inward at the end
      for (const s of stars) {
        const bx = s.x * width;
        const by = s.y * horizonY;
        const k = Math.min(1, pullS * 0.55 + grow * 0.4);
        const sx = lerp(bx, holeX, k);
        const sy = lerp(by, holeY, k);
        if (grow > 0.02) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + 0.5 * grow})`;
          ctx.lineWidth = s.r;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(lerp(sx, bx, 0.25 * grow), lerp(sy, by, 0.25 * grow));
          ctx.stroke();
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${0.25 + 0.75 * t})`;
          ctx.beginPath();
          ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // created a shooting star 
      if (!reduceMotion) {
        for (let i = 0; i < 3; i++) {
          const ph = (time / 5200 + hash(i * 13)) % 1;
          if (ph > 0.12) continue;
          const q = ph / 0.12;
          const sx0 = width * (0.15 + 0.7 * hash(i + 21));
          const sy0 = horizonY * (0.1 + 0.4 * hash(i + 31));
          const dx = -width * 0.18;
          const dy = horizonY * 0.12;
          const hx = sx0 + dx * q;
          const hy = sy0 + dy * q;
          ctx.strokeStyle = `rgba(255, 255, 255, ${(0.8 * (1 - q)).toFixed(3)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(hx, hy);
          ctx.lineTo(hx - dx * 0.3, hy - dy * 0.3);
          ctx.stroke();
        }
      }

      // ringed planet and two ridge lines along the horizon
      drawPlanet(
        width * 0.2,
        horizonY * 0.55,
        minDim * (0.09 + 0.03 * t),
        0.9 * (1 - pullS * 0.6),
      );
      drawMountains(
        horizonY,
        curveHere * width * 0.05,
        minDim * 0.1,
        "#141838",
        1,
      );
      drawMountains(
        horizonY,
        curveHere * width * 0.1,
        minDim * 0.06,
        "#0c0f26",
        7,
      );

      // ground
      const ground = ctx.createLinearGradient(0, horizonY, 0, height);
      ground.addColorStop(0, "#1b1f42");
      ground.addColorStop(1, "#090b1c");
      ctx.fillStyle = ground;
      ctx.fillRect(-60, horizonY, width + 120, height - horizonY + 80);

      // the trail fades away as the collapse begins
      ctx.globalAlpha = 1 - smooth(0, 1.8, c);

      // winding trail drawn row by row from near to far
      const rows: Row[] = [];
      for (let y = height + ROW_STEP; y >= horizonY + 1; y -= ROW_STEP) {
        const p = (y - horizonY) / span;
        if (p < MIN_P) break;
        const world = d + DEPTH_SCALE * (1 / p - 1) - aheadPlayer;
        const cx =
          vpX +
          (curve(clamp(world, 0, WORLD_LENGTH)) - curveHere) * lateral * p;
        rows.push({ y, cx, hw: roadBase * p, world });
      }
      for (let i = 0; i < rows.length - 1; i++) {
        const a = rows[i];
        const b = rows[i + 1];
        const stripe = ((Math.floor(a.world / 3) % 2) + 2) % 2;
        ctx.fillStyle = stripe === 0 ? "#2b3066" : "#242959";
        quad(
          a.cx - a.hw,
          a.y,
          a.cx + a.hw,
          a.y,
          b.cx + b.hw,
          b.y,
          b.cx - b.hw,
          b.y,
        );
        ctx.fillStyle = stripe === 0 ? "#5ef2ff" : "#ffb347";
        quad(
          a.cx - a.hw * 1.07,
          a.y,
          a.cx - a.hw * 0.96,
          a.y,
          b.cx - b.hw * 0.96,
          b.y,
          b.cx - b.hw * 1.07,
          b.y,
        );
        quad(
          a.cx + a.hw * 0.96,
          a.y,
          a.cx + a.hw * 1.07,
          a.y,
          b.cx + b.hw * 1.07,
          b.y,
          b.cx + b.hw * 0.96,
          b.y,
        );
        if (stripe === 0) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
          quad(
            a.cx - a.hw * 0.02,
            a.y,
            a.cx + a.hw * 0.02,
            a.y,
            b.cx + b.hw * 0.02,
            b.y,
            b.cx - b.hw * 0.02,
            b.y,
          );
        }
      }

      const maxAhead = DEPTH_SCALE * (1 / MIN_P - 1);

      // floating rocks on both sides that lean toward the black hole as it pulls
      const firstRock = Math.floor(d / ROCK_SPACING);
      for (
        let k = firstRock + Math.ceil(maxAhead / ROCK_SPACING) + 2;
        k >= firstRock;
        k--
      ) {
        const side = k % 2 === 0 ? 1 : -1;
        const pt = project(k * ROCK_SPACING, side * (1.5 + hash(k + 9) * 1.8));
        if (!pt) continue;
        const radius = roadBase * 0.12 * (0.6 + hash(k + 3)) * pt.p;
        const lift = hash(k + 5) * roadBase * 0.35 * pt.p;
        const rxp = lerp(pt.x, holeX, pullS * 0.3);
        const ryp = lerp(pt.y - lift, holeY, pullS * 0.3);
        ctx.fillStyle = "#3a3f6b";
        ctx.beginPath();
        ctx.ellipse(rxp, ryp, radius * 1.3, radius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#5a608f";
        ctx.beginPath();
        ctx.ellipse(
          rxp - radius * 0.3,
          ryp - radius * 0.3,
          radius * 0.6,
          radius * 0.4,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }

      // crystals on the trail that vanish as you reach them
      // just a visual effect, not a gameplay element
      const firstCrystal = Math.floor(d / CRYSTAL_SPACING) + 1;
      for (
        let k = firstCrystal + Math.ceil(maxAhead / CRYSTAL_SPACING);
        k >= firstCrystal;
        k--
      ) {
        const world = k * CRYSTAL_SPACING;
        if (world >= WORLD_LENGTH) continue;
        const pt = project(world, (Math.floor(hash(k) * 3) - 1) * 0.55);
        if (!pt || pt.p > PLAYER_P) continue;
        const r = roadBase * 0.09 * pt.p;
        const bob = Math.sin(time / 300 + k) * r * 0.3;
        ctx.shadowColor = "#5ef2ff";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#5ef2ff";
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y - r * 2 - bob);
        ctx.lineTo(pt.x + r, pt.y - r - bob);
        ctx.lineTo(pt.x, pt.y - bob);
        ctx.lineTo(pt.x - r, pt.y - r - bob);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;

      // the black hole swallows the far end of the trail
      drawBlackHole(holeX, holeY, holeR, time);

      // pieces of the world spiral into the hole
      if (c > 0.05) {
        for (let i = 0; i < DEBRIS_COUNT; i++) {
          const q = clamp((c - hash(i + 3) * 1.4) / 1.8, 0, 1);
          if (q <= 0 || q >= 1) continue;
          const e = q * q;
          const ang = e * 5 * (hash(i + 5) > 0.5 ? 1 : -1);
          const rx0 = vpX + (hash(i) - 0.5) * roadBase * 2.2 - holeX;
          const ry0 = horizonY + (0.25 + 0.75 * hash(i + 9)) * span - holeY;
          const k = 1 - e;
          const px = holeX + (rx0 * Math.cos(ang) - ry0 * Math.sin(ang)) * k;
          const py = holeY + (rx0 * Math.sin(ang) + ry0 * Math.cos(ang)) * k;
          const sz = (4 + 12 * hash(i + 7)) * (1 - e * 0.7);
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(ang * 2);
          ctx.globalAlpha = 1 - e * 0.5;
          ctx.fillStyle = DEBRIS_COLORS[i % DEBRIS_COLORS.length];
          ctx.fillRect(-sz / 2, -sz / 3, sz, sz * 0.66);
          ctx.restore();
        }
      }

      // screen edges darken as the pull gets stronger
      if (pullS > 0.01) {
        const inner = Math.min(holeR * 1.4, diag * 0.6);
        const vig = ctx.createRadialGradient(
          holeX,
          holeY,
          inner,
          holeX,
          holeY,
          diag * 0.7,
        );
        vig.addColorStop(0, "rgba(0, 0, 0, 0)");
        vig.addColorStop(1, `rgba(0, 0, 0, ${0.8 * pullS})`);
        ctx.fillStyle = vig;
        ctx.fillRect(-30, -30, width + 60, height + 60);
      }

      // dust spiraling into the disk
      for (let i = 0; i < DUST_COUNT; i++) {
        const phase = (time * 0.00022 * (0.5 + hash(i + 3)) + hash(i)) % 1;
        const rad = lerp(holeR * 4.5, holeR * 1.05, Math.pow(phase, 1.3));
        const a = hash(i + 7) * Math.PI * 2 + phase * 3.2;
        ctx.fillStyle = `rgba(255, 190, 120, ${0.65 * Math.sin(phase * Math.PI) * (0.3 + 0.7 * t)})`;
        ctx.fillRect(
          holeX + Math.cos(a) * rad,
          holeY + Math.sin(a) * rad * 0.42,
          2,
          2,
        );
      }

      // speed lines rush inward toward the black hole while you run
      if (speedVis > 0.03) {
        const maxR = diag * 0.75;
        ctx.lineWidth = 2;
        for (let i = 0; i < SPEED_LINES; i++) {
          const phase =
            (time * 0.0007 * (0.6 + hash(i + 40)) + hash(i + 80)) % 1;
          const angle = hash(i) * Math.PI * 2 + phase * 0.5;
          const head = holeR * 1.15 + maxR * Math.pow(1 - phase, 1.7);
          const tail =
            head + (0.05 + 0.18 * speedVis) * maxR * (1 - phase * 0.6);
          ctx.strokeStyle = `rgba(255, 225, 190, ${speedVis * 0.45 * (0.25 + 0.75 * phase)})`;
          ctx.beginPath();
          ctx.moveTo(
            holeX + Math.cos(angle) * head,
            holeY + Math.sin(angle) * head,
          );
          ctx.lineTo(
            holeX + Math.cos(angle) * tail,
            holeY + Math.sin(angle) * tail,
          );
          ctx.stroke();
        }
      }

      ctx.restore(); // end of the zoomed scene

      // stage two a wormhole tunnel of rings and swirling light
      const tun = smooth(1.8, 3.0, c) * (1 - smooth(4.5, 5.2, c));
      if (tun > 0.01) {
        const bg = ctx.createRadialGradient(
          holeX,
          holeY,
          0,
          holeX,
          holeY,
          diag * 0.7,
        );
        bg.addColorStop(0, `rgba(255, 240, 220, ${(0.9 * tun).toFixed(3)})`);
        bg.addColorStop(0.25, `rgba(255, 140, 50, ${(0.55 * tun).toFixed(3)})`);
        bg.addColorStop(1, `rgba(3, 4, 14, ${(0.95 * tun).toFixed(3)})`);
        ctx.fillStyle = bg;
        ctx.fillRect(-30, -30, width + 60, height + 60);
        for (let i = 0; i < 26; i++) {
          const z = (i / 26 + time / 1500) % 1;
          const rad = z * z * diag * 0.8 + 4;
          const a = tun * 0.85 * Math.sin(Math.PI * z);
          ctx.strokeStyle = `hsla(${Math.round(25 + z * 170)}, 100%, ${Math.round(55 + z * 30)}%, ${a.toFixed(3)})`;
          ctx.lineWidth = 1 + z * z * 18;
          ctx.beginPath();
          ctx.arc(holeX, holeY, rad, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = `rgba(255, 210, 160, ${(0.14 * tun).toFixed(3)})`;
        for (let i = 0; i < 36; i++) {
          const ang = (i / 36) * Math.PI * 2 + time / 4000;
          ctx.beginPath();
          ctx.moveTo(
            holeX + Math.cos(ang) * diag * 0.04,
            holeY + Math.sin(ang) * diag * 0.04,
          );
          ctx.lineTo(
            holeX + Math.cos(ang) * diag * 0.9,
            holeY + Math.sin(ang) * diag * 0.9,
          );
          ctx.stroke();
        }
      }

      // stage four the other side a new galaxy with a ringed planet and a sun
      const nw = smooth(5.0, 6.4, c);
      if (nw > 0.01) {
        ctx.fillStyle = `rgba(2, 3, 10, ${nw.toFixed(3)})`;
        ctx.fillRect(-30, -30, width + 60, height + 60);
        for (let i = 0; i < 160; i++) {
          const ang = hash(i) * Math.PI * 2;
          const ph = ((time / 16000) * (0.4 + hash(i + 5)) + hash(i + 9)) % 1;
          const rad = ph * diag * 0.7;
          ctx.fillStyle = `rgba(255, 255, 255, ${(nw * (0.3 + 0.7 * ph)).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(
            holeX + Math.cos(ang) * rad,
            holeY + Math.sin(ang) * rad,
            0.4 + ph * 1.6,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
        drawNebula(nw * 1.6, time, height);
        drawPlanet(
          vpX + width * 0.18,
          height * 0.62 + (1 - nw) * minDim * 0.3,
          minDim * 0.34,
          nw,
        );
        const sunX = width * 0.12;
        const sunY = height * 0.18;
        const sun = ctx.createRadialGradient(
          sunX,
          sunY,
          0,
          sunX,
          sunY,
          minDim * 0.5,
        );
        sun.addColorStop(0, `rgba(255, 235, 200, ${(0.6 * nw).toFixed(3)})`);
        sun.addColorStop(1, "rgba(255, 235, 200, 0)");
        ctx.fillStyle = sun;
        ctx.fillRect(sunX - minDim * 0.5, sunY - minDim * 0.5, minDim, minDim);
        for (const k of [0.3, 0.5, 0.8]) {
          ctx.fillStyle = `rgba(255, 220, 170, ${(0.12 * nw).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(
            lerp(sunX, vpX, k),
            lerp(sunY, height / 2, k),
            minDim * 0.03 * (1 + k),
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
        const rt = clamp((c - 5.0) / 1.4, 0, 1);
        if (rt > 0 && rt < 1) {
          ctx.strokeStyle = `rgba(255, 235, 200, ${(0.7 * (1 - rt)).toFixed(3)})`;
          ctx.lineWidth = lerp(14, 2, rt);
          ctx.beginPath();
          ctx.arc(holeX, holeY, rt * diag * 0.8, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Helmet frame with the visor cut out
      const frameGrad = ctx.createLinearGradient(0, 0, 0, height);
      frameGrad.addColorStop(0, "#161c3c");
      frameGrad.addColorStop(1, "#05060e");
      ctx.fillStyle = frameGrad;
      ctx.beginPath();
      ctx.rect(-30, -30, width + 60, height + 60);
      addWindow();
      ctx.fill("evenodd");

      // Glass: gold tint, reflections, breath fog, droplets, and frost
      ctx.save();
      ctx.beginPath();
      addWindow();
      ctx.clip();

      const tint = ctx.createRadialGradient(
        vpX,
        height / 2,
        minDim * 0.35,
        vpX,
        height / 2,
        diag * 0.6,
      );
      tint.addColorStop(0, "rgba(255, 190, 90, 0)");
      tint.addColorStop(1, "rgba(255, 190, 90, 0.22)");
      ctx.fillStyle = tint;
      ctx.fillRect(mx, my, ww, wh);

      const refl = ctx.createLinearGradient(
        mx,
        my,
        mx + ww * 0.5,
        my + wh * 0.6,
      );
      refl.addColorStop(0, "rgba(255, 255, 255, 0.1)");
      refl.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = refl;
      quad(
        mx + ww * 0.1,
        my,
        mx + ww * 0.24,
        my,
        mx + ww * 0.06,
        my + wh * 0.7,
        mx - ww * 0.08,
        my + wh * 0.7,
      );
      quad(
        mx + ww * 0.27,
        my,
        mx + ww * 0.3,
        my,
        mx + ww * 0.12,
        my + wh * 0.7,
        mx + ww * 0.09,
        my + wh * 0.7,
      );

      const breath = 0.5 + 0.5 * Math.sin(time / 900);
      const fogAlpha =
        (0.05 + 0.12 * breath) * (0.4 + 0.6 * speedVis) + 0.3 * fade;
      const fog = ctx.createRadialGradient(
        vpX,
        my + wh,
        0,
        vpX,
        my + wh,
        minDim * 0.55,
      );
      fog.addColorStop(0, `rgba(215, 235, 255, ${fogAlpha})`);
      fog.addColorStop(1, "rgba(215, 235, 255, 0)");
      ctx.fillStyle = fog;
      ctx.fillRect(mx, my, ww, wh);

      for (let i = 0; i < 9; i++) {
        const dx = mx + ww * hash(i + 50);
        const dy = my + wh * (0.55 + 0.45 * hash(i + 60));
        const dr = 1.5 + 2.5 * hash(i + 70);
        ctx.fillStyle = "rgba(220, 240, 255, 0.16)";
        ctx.beginPath();
        ctx.ellipse(dx, dy, dr, dr * 1.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.beginPath();
        ctx.arc(dx - dr * 0.3, dy - dr * 0.4, dr * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      if (fade > 0) {
        const frost = ctx.createRadialGradient(
          vpX,
          height / 2,
          minDim * 0.2,
          vpX,
          height / 2,
          diag * 0.55,
        );
        frost.addColorStop(0, "rgba(220, 240, 255, 0)");
        frost.addColorStop(1, `rgba(220, 240, 255, ${0.45 * fade})`);
        ctx.fillStyle = frost;
        ctx.fillRect(mx, my, ww, wh);
      }
      ctx.restore();

      // helmet rim plus gets lit orange by the black hole as it gets closer
      ctx.beginPath();
      addWindow();
      ctx.lineWidth = 8;
      ctx.strokeStyle = "#232b57";
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(180, 200, 255, 0.35)";
      ctx.stroke();
      if (pullS > 0.02) {
        ctx.shadowColor = "#ff9a3c";
        ctx.shadowBlur = 24;
        ctx.lineWidth = 3;
        ctx.strokeStyle = `rgba(255, 154, 60, ${0.55 * pullS})`;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // rivets along the frame
      for (let i = 0; i < 12; i++) {
        const rx = lerp(mx + wr, mx + ww - wr, i / 11);
        for (const ry of [my * 0.5, height - mb * 0.2]) {
          ctx.fillStyle = "#3a4478";
          ctx.strokeStyle = "#05060f";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }

      // collar band with status lights
      ctx.fillStyle = "#ff8a3d";
      ctx.strokeStyle = "#05060f";
      ctx.lineWidth = 3;
      rrect(vpX - width * 0.12, height - mb * 0.62, width * 0.24, mb * 0.22, 6);
      ctx.fill();
      ctx.stroke();
      ["#5ef2ff", "#ffb347", "#7be0a0"].forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(mx + 34 + i * 20, height - mb * 0.5, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // hud inside the visor
      ctx.textAlign = "left";
      ctx.font = "13px ui-monospace, monospace";
      const hx = mx + 26;
      const hy = my + 24;
      panel(hx, hy, 190, 72);
      const o2 = Math.round(100 - 38 * t);
      ctx.fillStyle = "#5ef2ff";
      ctx.fillText(`O2 ${o2}%`, hx + 12, hy + 22);
      ctx.fillStyle = "rgba(94, 242, 255, 0.2)";
      ctx.fillRect(hx + 12, hy + 30, 166, 8);
      ctx.fillStyle = o2 > 70 ? "#5ef2ff" : "#ffb347";
      ctx.fillRect(hx + 12, hy + 30, 166 * (o2 / 100), 8);
      ctx.fillStyle = "#5ef2ff";
      ctx.fillText(`TEMP ${Math.round(-120 - 60 * t)} C`, hx + 12, hy + 58);

      const px0 = mx + ww - 26 - 190;
      panel(px0, hy, 190, 72);
      const bpm = Math.round(70 + 75 * speedVis + 4 * Math.sin(time / 1100));
      ctx.fillStyle = "#7be0a0";
      ctx.fillText(`PULSE ${bpm}`, px0 + 12, hy + 22);
      ctx.strokeStyle = "#7be0a0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 166; i += 3) {
        const p = ((i / 166) * 2 + time / (1500 - 700 * speedVis)) % 1;
        const y = hy + 52 - ecg(p);
        if (i === 0) ctx.moveTo(px0 + 12 + i, y);
        else ctx.lineTo(px0 + 12 + i, y);
      }
      ctx.stroke();

      const bx = vpX - 170;
      const by = height - mb - 56;
      panel(bx, by, 340, 40);
      ctx.fillStyle = "#5ef2ff";
      ctx.textAlign = "center";
      ctx.fillText(
        c > 5.2
          ? "EVENT HORIZON CROSSED"
          : `EVENT HORIZON ${Math.round(elevation * (1 - t)).toLocaleString()} m`,
        vpX,
        by + 17,
      );
      ctx.fillStyle = "rgba(94, 242, 255, 0.2)";
      ctx.fillRect(bx + 12, by + 26, 316, 5);
      ctx.fillStyle = "#ffb347";
      ctx.fillRect(bx + 12, by + 26, 316 * t, 5);
      ctx.textAlign = "right";
      ctx.fillStyle = "#5ef2ff";
      ctx.fillText(
        `CRYSTALS ${Math.floor(d / CRYSTAL_SPACING)}`,
        mx + ww - 26,
        height - mb - 18,
      );

      // title on the other side
      const title = smooth(5.4, 6.6, c);
      if (title > 0.01) {
        ctx.globalAlpha = title;
        ctx.textAlign = "center";
        ctx.font = "700 28px Orbitron, ui-monospace, monospace";
        ctx.fillStyle = "#ffe2b0";
        ctx.shadowColor = "#ff9a3c";
        ctx.shadowBlur = 18;
        ctx.fillText("EVENT HORIZON CROSSED", vpX, height * 0.22);
        ctx.shadowBlur = 0;
        ctx.font = "14px ui-monospace, monospace";
        ctx.fillStyle = "#cfe9ff";
        ctx.fillText("WELCOME TO THE OTHER SIDE", vpX, height * 0.22 + 28);
        ctx.globalAlpha = 1;
      }

      ctx.restore(); // end of the helmet rumble

      // stage three white-out as you cross
      if (!reduceMotion) {
        const flash = Math.max(0, 1 - Math.abs(c - 5.0) / 0.55);
        if (flash > 0) {
          ctx.fillStyle = `rgba(255, 248, 235, ${flash.toFixed(3)})`;
          ctx.fillRect(0, 0, width, height);
        }
      }

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="trail-canvas"
      role="progressbar"
      aria-label="Climb progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
    />
  );
}
