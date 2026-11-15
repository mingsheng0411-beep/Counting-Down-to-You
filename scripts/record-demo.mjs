// Records the self-playing demo reel into an mp4.
//
//   node scripts/record-demo.mjs [baseUrl] [outputFile]
//
// Needs the site running (a production build looks best: `npm run build`,
// then `npx next start -p 3100`), Microsoft Edge, and ffmpeg on the PATH.
//
// The reel is played at half speed (/zh/demo/record) and sped back up when
// encoding, so every second of the result is built from twice as many
// captured frames and stays smooth. It is played twice first so the map
// tiles are already loaded.
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { chromium } from "playwright-core";

const base = process.argv[2] ?? "http://localhost:3100";
const output = resolve(process.argv[3] ?? "demo.mp4");
const url = `${base}/zh/demo/record`;
const SECONDS = 23;
const SLOW = 2;
const WIDTH = 2560;
const HEIGHT = 1440;
const FPS = 60;

const work = join(tmpdir(), "reel-recording");
const frameDir = join(work, "frames");
rmSync(frameDir, { recursive: true, force: true });
mkdirSync(frameDir, { recursive: true });

const context = await chromium.launchPersistentContext(join(work, "profile"), {
  channel: "msedge",
  headless: false,
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1,
  args: [
    "--force-device-scale-factor=1",
    "--window-position=0,0",
    // Keep painting at full speed even if the window is covered.
    "--disable-features=CalculateNativeWinOcclusion",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
  ],
});
const page = context.pages()[0] ?? (await context.newPage());
const reelStart = () =>
  page
    .waitForFunction(() => window.__reelStartedAt, null, { timeout: 60_000 })
    .then(() => page.evaluate(() => performance.timeOrigin + window.__reelStartedAt));
const playMs = SECONDS * SLOW * 1000;

// Two warm-up runs: fast camera moves ask for tiles at in-between zooms,
// and it takes a second pass to have all of them cached.
for (const pass of [1, 2]) {
  console.log(`Warm-up run ${pass} of 2 (loading map tiles)...`);
  await page.goto("about:blank");
  await page.goto(url);
  await reelStart();
  await page.waitForTimeout(playMs + 1500);
}

console.log("Recording...");
const cdp = await context.newCDPSession(page);
const frames = [];
cdp.on("Page.screencastFrame", (frame) => {
  const file = join(frameDir, `${String(frames.length).padStart(5, "0")}.jpg`);
  writeFileSync(file, Buffer.from(frame.data, "base64"));
  frames.push({ file, at: frame.metadata.timestamp * 1000 });
  // The last acknowledgement can race with the browser closing; that's fine.
  cdp.send("Page.screencastFrameAck", { sessionId: frame.sessionId }).catch(() => {});
});
await page.goto("about:blank");
await cdp.send("Page.startScreencast", {
  format: "jpeg",
  quality: 92,
  maxWidth: WIDTH,
  maxHeight: HEIGHT,
  everyNthFrame: 1,
});
await page.goto(url);
const startedAt = await reelStart();
await page.waitForTimeout(playMs + 800);
await cdp.send("Page.stopScreencast").catch(() => {});
await context.close();

// Keep the frames inside the reel, and give each the time it was on screen,
// divided by the slow-down so the result plays at normal speed.
const endAt = startedAt + playMs;
const kept = frames.filter((frame) => frame.at >= startedAt - 40 && frame.at <= endAt);
if (kept.length < 2) throw new Error("No frames were captured");
const list = [];
kept.forEach((frame, index) => {
  const next = index + 1 < kept.length ? kept[index + 1].at : endAt;
  list.push(`file '${frame.file.replaceAll("\\", "/")}'`);
  list.push(`duration ${Math.max(0.0005, (next - frame.at) / 1000 / SLOW).toFixed(5)}`);
});
list.push(`file '${kept.at(-1).file.replaceAll("\\", "/")}'`);
const listFile = join(work, "frames.txt");
writeFileSync(listFile, list.join("\n"));

const perSecond = (kept.length / SECONDS).toFixed(0);
console.log(`Captured ${kept.length} frames (${perSecond} per second of video). Encoding...`);
const encode = spawnSync(
  "ffmpeg",
  [
    "-y", "-loglevel", "error",
    "-f", "concat", "-safe", "0", "-i", listFile,
    "-vf", `fps=${FPS},scale=${WIDTH}:${HEIGHT}:flags=lanczos`,
    "-t", String(SECONDS),
    "-c:v", "libx264", "-preset", "slow", "-crf", "17",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    output,
  ],
  { stdio: "inherit" },
);
if (encode.status !== 0) throw new Error("ffmpeg failed");
console.log(`Saved ${output}`);
