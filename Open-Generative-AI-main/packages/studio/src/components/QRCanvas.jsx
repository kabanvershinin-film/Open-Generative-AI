import React, { useEffect, useRef } from "react";
import { generateQR } from "./qrcode-gen";

/** Рендерит QR-код локально на canvas (без внешних сервисов). */
export default function QRCanvas({ value, size = 220 }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !value) return;
    try {
      const { size: n, modules } = generateQR(value);
      const margin = 4; // тихая зона в модулях
      const total = n + margin * 2;
      const scale = Math.max(1, Math.floor(size / total));
      const px = scale * total;
      canvas.width = px;
      canvas.height = px;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, px, px);
      ctx.fillStyle = "#000000";
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (modules[r][c]) {
            ctx.fillRect((c + margin) * scale, (r + margin) * scale, scale, scale);
          }
        }
      }
    } catch (e) {
      console.error("QR render failed:", e);
    }
  }, [value, size]);

  return <canvas ref={ref} style={{ width: size, height: size, imageRendering: "pixelated" }} />;
}
