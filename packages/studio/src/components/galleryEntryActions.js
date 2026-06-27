function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeFilePart(value, fallback) {
  const normalized = String(value ?? "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || fallback;
}

function getExtensionFromUrl(url, fallback) {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([a-z0-9]+)$/i);
    return match?.[1]?.toLowerCase() || fallback;
  } catch {
    const match = String(url || "").match(/\.([a-z0-9]+)(?:[?#]|$)/i);
    return match?.[1]?.toLowerCase() || fallback;
  }
}

export function getGalleryEntryFilename(entry) {
  const extByType = {
    image: "png",
    video: "mp4",
    audio: "mp3",
    text: "txt",
  };
  const ext = getExtensionFromUrl(entry?.url, extByType[entry?.type] || "bin");
  const typePart = sanitizeFilePart(entry?.type, "media");
  const modelPart = sanitizeFilePart(entry?.model, typePart);
  const idPart = sanitizeFilePart(entry?.id, "file");
  return `${modelPart}-${idPart}.${ext}`;
}

export function buildGalleryViewerHtml(entry) {
  const title = escapeHtml(entry?.model || entry?.type || "Медиа");
  const mediaUrl = escapeHtml(entry?.url || "");
  const prompt = entry?.prompt ? `<div class="meta">${escapeHtml(entry.prompt)}</div>` : "";

  let content = `<div class="fallback">Нет данных для просмотра</div>`;
  if (entry?.type === "image") {
    content = `<img src="${mediaUrl}" alt="${title}" />`;
  } else if (entry?.type === "video") {
    content = `<video src="${mediaUrl}" controls autoplay playsinline preload="metadata"></video>`;
  } else if (entry?.type === "audio") {
    content = `<audio src="${mediaUrl}" controls autoplay preload="metadata"></audio>`;
  } else if (entry?.type === "text") {
    content = `<pre>${escapeHtml(entry?.prompt || entry?.url || "")}</pre>`;
  }

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    :root { color-scheme: dark; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      background: #050505;
      color: #fff;
      font-family: Arial, sans-serif;
      padding: 24px;
      box-sizing: border-box;
    }
    img, video {
      max-width: min(100%, 1200px);
      max-height: calc(100vh - 140px);
      border-radius: 12px;
      background: #000;
    }
    audio {
      width: min(100%, 720px);
    }
    pre, .fallback, .meta {
      width: min(100%, 960px);
      white-space: pre-wrap;
      word-break: break-word;
      color: rgba(255,255,255,0.8);
    }
    .meta {
      font-size: 14px;
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${content}
  ${prompt}
</body>
</html>`;
}

export function openGalleryEntry(entry) {
  if (typeof window === "undefined") return;
  const popup = window.open("", "_blank", "noopener,noreferrer");
  if (!popup) {
    window.open(entry?.url || "", "_blank", "noopener,noreferrer");
    return;
  }
  popup.document.open();
  popup.document.write(buildGalleryViewerHtml(entry));
  popup.document.close();
}

export async function downloadGalleryEntry(entry) {
  if (typeof document === "undefined") return;
  const filename = getGalleryEntryFilename(entry);
  const response = await fetch(entry?.url || "");
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
