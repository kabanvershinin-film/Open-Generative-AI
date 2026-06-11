'use client';
import React, { useEffect, useRef } from 'react';

function NeonPixelBackground() {
  const canvasRef = useRef(null);

  useEffect(() =&gt; {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W, H, cols, rows, cells = [];
    const PIXEL = 4;
    const GAP = 1;
    const STEP = PIXEL + GAP;

    const resize = () =&gt; {
      const r = canvas.getBoundingClientRect();
      W = canvas.width = r.width * window.devicePixelRatio;
      H = canvas.height = r.height * window.devicePixelRatio;
      canvas.style.height = '100%';
      canvas.style.width = '100%';
      cols = Math.ceil(W / STEP);
      rows = Math.ceil(H / STEP);
      init();
    };

    const init = () =&gt; {
      cells = [];
      for (let row = 0; row &lt; rows; row++) {
        for (let col = 0; col &lt; cols; col++) {
          cells.push({
            x: col * STEP,
            y: row * STEP,
            alpha: 0,
            threshold: Math.random(),
            purple: Math.random() &lt; 0.5
          });
        }
      }
    };

    const density = (x, y, t) =&gt; {
      const nx = x / W;
      const ny = y / H;
      let d = 0;
      d += 0.5 + 0.5 * Math.sin(nx * 7.0 + ny * 2.5 + t * 0.004);
      d += 0.5 + 0.5 * Math.sin(nx * 4.5 - ny * 6.0 + t * 0.003);
      d += 0.5 + 0.5 * Math.cos(nx * 3.0 + ny * 8.0 - t * 0.005);
      d += 0.5 + 0.5 * Math.sin(nx * 10.0 - ny * 3.5 + t * 0.0035);
      return d / 4;
    };

    let t = 0;
    const draw = () =&gt; {
      t++;
      ctx.clearRect(0, 0, W, H);
      for (const c of cells) {
        const d = density(c.x, c.y, t);
        if (d &gt; c.threshold) c.alpha = Math.min(1, c.alpha + 0.18);
        else c.alpha = Math.max(0, c.alpha - 0.14);
        if (c.alpha &lt;= 0) continue;
        ctx.globalAlpha = c.alpha * (0.35 + d * 0.65);
        ctx.fillStyle = c.purple ? '#a855f7' : '#d946ef';
        ctx.fillRect(c.x, c.y, PIXEL, PIXEL);
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () =&gt; window.removeEventListener('resize', resize);
  }, []);

  return (
    &lt;canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        position: 'absolute',
        inset: 0
      }}
    /&gt;
  );
}

export default NeonPixelBackground;
