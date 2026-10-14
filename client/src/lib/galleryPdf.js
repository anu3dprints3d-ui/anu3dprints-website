const INK = [20, 17, 12];
const GOLD = [245, 183, 0];
const MUTED = [107, 100, 85];
const TILE = [245, 241, 232];

const MAX_IMAGES = 60;
const MAX_PX = 1000; // longest side of each embedded image: sharp in print, small file

/** Downloads an image and returns it re-encoded as a JPEG data URL (jsPDF cannot embed WebP). */
async function loadAsJpeg(url) {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error("image fetch failed");
  const bitmap = await createImageBitmap(await res.blob());
  const scale = Math.min(1, MAX_PX / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff"; // JPEG has no alpha
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return { data: canvas.toDataURL("image/jpeg", 0.85), w, h };
}

/** Runs `fn` over `list` with at most `limit` in flight, keeping results in order. */
async function mapLimit(list, limit, fn) {
  const out = new Array(list.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, list.length) }, async () => {
      while (next < list.length) {
        const i = next++;
        out[i] = await fn(list[i], i);
      }
    }),
  );
  return out;
}

/** Keeps text printable in the PDF's built-in Latin font. */
const clean = (s) =>
  Array.from(String(s ?? ""), (ch) => {
    const c = ch.charCodeAt(0);
    return (c >= 32 && c <= 126) || (c >= 161 && c <= 255) ? ch : " ";
  })
    .join("")
    .split(/\s+/)
    .join(" ")
    .trim();

/**
 * Builds and downloads a branded PDF catalogue of the given gallery items.
 * items: [{ src, alt, caption, type }]. Returns { pages, skipped }.
 */
export async function exportGalleryPdf({ items, businessName, tagline, siteUrl, filterLabel, onProgress }) {
  const { jsPDF } = await import("jspdf");
  const list = items.slice(0, MAX_IMAGES);

  let done = 0;
  const images = await mapLimit(list, 4, async (item) => {
    try {
      return await loadAsJpeg(item.src);
    } catch {
      return null;
    } finally {
      onProgress?.(++done, list.length);
    }
  });

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const M = 14;
  const GAP = 8;
  const CW = (W - 2 * M - GAP) / 2; // cell width
  const IH = CW * 0.68; // image box height (3 rows fit per page)
  const ROW = IH + 17; // image + caption + spacing
  const BOTTOM = H - 16;
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const startPage = (first) => {
    doc.setFillColor(...INK);
    if (first) {
      doc.rect(0, 0, W, 34, "F");
      doc.setFillColor(...GOLD);
      doc.rect(M, 11, 14, 1.6, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text(clean(businessName) || "Gallery", M, 22);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GOLD);
      doc.text(`Project Gallery${filterLabel ? ` - ${clean(filterLabel)}` : ""}  |  ${today}`, M, 29);
      if (tagline) {
        doc.setTextColor(210, 205, 195);
        doc.text(clean(tagline), W - M, 22, { align: "right" });
      }
      return 42;
    }
    doc.rect(0, 0, W, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(clean(businessName) || "Gallery", M, 6.5);
    return 18;
  };

  let y = startPage(true);
  let col = 0;
  let skipped = 0;

  list.forEach((item, i) => {
    if (col === 0 && y + ROW > BOTTOM) {
      doc.addPage();
      y = startPage(false);
    }
    const x = M + col * (CW + GAP);

    doc.setFillColor(...TILE);
    doc.roundedRect(x, y, CW, IH, 2, 2, "F");

    const img = images[i];
    if (img) {
      const ratio = Math.min(CW / img.w, IH / img.h);
      const dw = img.w * ratio;
      const dh = img.h * ratio;
      doc.addImage(img.data, "JPEG", x + (CW - dw) / 2, y + (IH - dh) / 2, dw, dh, undefined, "FAST");
    } else {
      skipped++;
      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.text("Image unavailable", x + CW / 2, y + IH / 2, { align: "center" });
    }

    const caption = clean(item.caption) || clean(item.alt);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    const lines = doc.splitTextToSize(caption, CW).slice(0, 2);
    doc.text(lines, x, y + IH + 5);
    if (item.type) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...MUTED);
      doc.text(clean(item.type).toUpperCase(), x, y + IH + 5 + lines.length * 4 + 0.5);
    }

    col = (col + 1) % 2;
    if (col === 0) y += ROW;
  });

  // Footer on every page: brand + site on the left, page numbers on the right.
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.4);
    doc.line(M, H - 12, W - M, H - 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`${clean(businessName)}${siteUrl ? `  |  ${siteUrl.replace(/^https?:\/\//, "")}` : ""}`, M, H - 7);
    doc.text(`Page ${p} of ${pages}`, W - M, H - 7, { align: "right" });
  }

  doc.setProperties({ title: `${clean(businessName)} - Project Gallery`, creator: clean(businessName) });
  doc.save(`anu3d-gallery-${new Date().toISOString().slice(0, 10)}.pdf`);
  return { pages, skipped, truncated: items.length > MAX_IMAGES };
}
