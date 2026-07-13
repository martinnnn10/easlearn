/**
 * Client-side share-card image generator (no dependencies, no server render).
 *
 * Draws the Fault-of-the-Day result as a branded PNG on an offscreen canvas.
 * Image shares convert far better on social than text. Uses rounded rects for the
 * score grid (reliable cross-platform, unlike emoji-in-canvas).
 */

export interface ShareCardOpts {
  dateKey: string;
  methodologyPercent: number;
  tier: string;
  percentile: number | null;
  faultTitle: string;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Render the card and return a PNG blob (1200×630, OG-image ratio). */
export async function generateDailyShareCard(opts: ShareCardOpts): Promise<Blob> {
  const W = 1200, H = 630;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0a0f0a");
  bg.addColorStop(1, "#0d160d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Accent bar
  ctx.fillStyle = "#10b981";
  ctx.fillRect(0, 0, W, 8);

  // Kicker
  ctx.fillStyle = "#10b981";
  ctx.font = "bold 30px Arial, sans-serif";
  ctx.fillText("⚡ FAULT OF THE DAY", 72, 110);

  // Date
  ctx.fillStyle = "#6b7280";
  ctx.font = "24px Arial, sans-serif";
  ctx.fillText(opts.dateKey, 72, 150);

  // Big score
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 160px Arial, sans-serif";
  ctx.fillText(`${opts.methodologyPercent}%`, 64, 330);

  // Tier
  ctx.fillStyle = "#a7f3d0";
  ctx.font = "bold 40px Arial, sans-serif";
  ctx.fillText(opts.tier, 72, 400);

  // Percentile
  if (opts.percentile != null) {
    ctx.fillStyle = "#9ca3af";
    ctx.font = "28px Arial, sans-serif";
    ctx.fillText(`Top ${100 - opts.percentile}% of today's solvers`, 72, 445);
  }

  // Score grid (5 blocks)
  const filled = Math.round((opts.methodologyPercent / 100) * 5);
  const bx = 72, by = 490, size = 64, gap = 16;
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < filled ? "#10b981" : "#1f2937";
    roundRect(ctx, bx + i * (size + gap), by, size, size, 12);
    ctx.fill();
  }

  // Fault title (truncated)
  ctx.fillStyle = "#6b7280";
  ctx.font = "22px Arial, sans-serif";
  const t = opts.faultTitle.length > 52 ? opts.faultTitle.slice(0, 49) + "…" : opts.faultTitle;
  ctx.fillText(t, 72, 600);

  // CTA (right side)
  ctx.fillStyle = "#10b981";
  ctx.font = "bold 30px Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("easlearn.org/daily", W - 72, 600);
  ctx.textAlign = "left";

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"),
  );
}

/** Share the card via Web Share (with file) where possible, else download it. */
export async function shareOrDownloadCard(blob: Blob, dateKey: string): Promise<"shared" | "downloaded"> {
  const file = new File([blob], `fault-of-the-day-${dateKey}.png`, { type: "image/png" });
  const navAny = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (navAny.canShare && navAny.canShare({ files: [file] }) && navigator.share) {
    await navigator.share({ files: [file], text: `My Fault of the Day result · easlearn.org/daily` });
    return "shared";
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
  return "downloaded";
}
