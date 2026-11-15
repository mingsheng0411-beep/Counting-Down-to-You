import type { WeatherKind } from "@/domain/weather";

const TAU = Math.PI * 2;
const INK = "#0a0b0f";

/** Outline of a small cloud, about 22 wide, centred on the origin. */
function traceCloud(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(-6.5, 5);
  ctx.lineTo(7, 5);
  ctx.arc(7, 1.5, 3.5, Math.PI / 2, -Math.PI / 2, true);
  ctx.arc(1.5, -2.5, 5, -0.1, Math.PI + 0.5, true);
  ctx.arc(-6.5, 1, 4, -1.2, Math.PI / 2, true);
  ctx.closePath();
}

/** Strokes the current path as line art: a white halo, then the ink line. */
function ink(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 3.8;
  ctx.stroke();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.25;
  ctx.stroke();
}

/**
 * Draws a small line-art weather glyph centred at (x, y). `time` is in
 * milliseconds and drives the motion: the sun turns, rain and snow fall,
 * clouds drift.
 */
export function drawWeather(
  ctx: CanvasRenderingContext2D,
  kind: WeatherKind,
  x: number,
  y: number,
  time: number,
  alpha: number,
) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.55, 1.55);
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (kind === "clear-day") {
    ctx.beginPath();
    ctx.arc(0, 0, 5.2, 0, TAU);
    const turn = time / 5000;
    for (let i = 0; i < 8; i += 1) {
      const angle = turn + (i * TAU) / 8;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      ctx.moveTo(cos * 8.4, sin * 8.4);
      ctx.lineTo(cos * 11.4, sin * 11.4);
    }
    ink(ctx);
  } else if (kind === "clear-night") {
    ctx.rotate(-0.35 + Math.sin(time / 2600) * 0.06);
    ctx.beginPath();
    ctx.arc(0, 0, 7, 1.025, TAU - 1.025, false);
    ctx.arc(3.2, 0, 6, TAU - 1.5, 1.5, true);
    ctx.closePath();
    ink(ctx);
  } else {
    const falling = kind === "rain" || kind === "snow";
    ctx.save();
    ctx.translate(falling ? 0 : Math.sin(time / 1800) * 1.6, falling ? -4 : 0);
    traceCloud(ctx);
    ink(ctx);
    ctx.restore();

    if (kind === "rain") {
      // A few short strokes sliding down and to the left, one after another.
      for (let i = 0; i < 4; i += 1) {
        const fall = (time / 780 + i * 0.27) % 1;
        const dropX = -7 + i * 4.8 - fall * 3;
        const dropY = 3.5 + fall * 9;
        ctx.globalAlpha = alpha * Math.sin(Math.PI * fall);
        ctx.beginPath();
        ctx.moveTo(dropX, dropY);
        ctx.lineTo(dropX - 1.6, dropY + 4.2);
        ink(ctx);
      }
    } else if (kind === "snow") {
      for (let i = 0; i < 4; i += 1) {
        const fall = (time / 2100 + i * 0.27) % 1;
        const flakeX = -7 + i * 4.8 + Math.sin(fall * TAU + i) * 1.4;
        const flakeY = 4 + fall * 10;
        ctx.globalAlpha = alpha * Math.sin(Math.PI * fall);
        ctx.beginPath();
        ctx.arc(flakeX, flakeY, 0.9, 0, TAU);
        ink(ctx);
      }
    }
  }
  ctx.restore();
}
