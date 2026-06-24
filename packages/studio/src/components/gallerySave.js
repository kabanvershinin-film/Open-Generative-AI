export async function saveMediaToGallery({ url, type = "image", model = "", prompt = "" }) {
  if (!url || typeof url !== "string") return null;

  const response = await fetch("/api/gallery", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      url,
      type,
      model,
      prompt,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || String(response.status));
  }

  return payload?.entry || null;
}
