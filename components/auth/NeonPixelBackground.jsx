'use client';
import React, { useEffect, useRef } from 'react';

function NeonPixelBackground() {
  const canvasRef = useRef(null);

  useEffect(function() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W, H, cols, rows, cells = [];
    const PIXEL = 12;
    const GAP = 4;
    const STEP = PIXEL + GAP;

    function resize() {
      const r = canvas.getBoundingClientRect();
      W = canvas.width = r.width * window.devicePixelRatio;
      H = canvas.height = r.height * window.devicePixelRatio;
      canvas.style.height = '100%';
      canvas.style.width = '100%';
      cols = Math.ceil(W / STEP);
      rows = Math.ceil(H / STEP);
      init();
    }

    function init() {
      cells = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          cells.push({
            x: col * STEP,
            y: row * STEP,
            alpha: 0,
            threshold: Math.random(),
            purple: Math.random() < 0.5
          });
        }
      }
    }

    function isInsideModal(x, y) {
      // Modal is on the right side
      const modalWidth = 448; // max-w-md
      const modalPadding = 96; // pr-24 is 6rem, ~96px
      const modalXStart = W - (modalWidth + modalPadding) * window.devicePixelRatio;
      const modalXEnd = W - modalPadding * window.devicePixelRatio;
      const modalYStart = H * 0.2;
      const modalYEnd = H * 0.8;

      return x > modalXStart && x < modalXEnd && y > modalYStart && y < modalYEnd;
    }

    function density(x, y, t) {
      const nx = x / W;
      const ny = y / H;
      let d = 0;
      d += 0.5 + 0.5 * Math.sin(nx * 7.0 + ny * 2.5 + t * 0.004);
      d += 0.5 + 0.5 * Math.sin(nx * 4.5 - ny * 6.0 + t * 0.003);
      d += 0.5 + 0.5 * Math.cos(nx * 3.0 + ny * 8.0 - t * 0.005);
      d += 0.5 + 0.5 * Math.sin(nx * 10.0 - ny * 3.5 + t * 0.0035);
      return d / 4;
    }

    let t = 0;
    function draw() {
      t++;
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        
        if (isInsideModal(c.x, c.y)) {
          c.alpha = Math.max(0, c.alpha - 0.2);
        } else {
          const d = density(c.x, c.y, t);
          if (d > c.threshold) {
            c.alpha = Math.min(1, c.alpha + 0.18);
          } else {
            c.alpha = Math.max(0, c.alpha - 0.14);
          }
        }
        
        if (c.alpha <= 0) continue;
        const d = density(c.x, c.y, t);
        ctx.globalAlpha = c.alpha * (0.35 + d * 0.65);
        ctx.fillStyle = c.purple ? '#a855f7' : '#d946ef';
        ctx.fillRect(c.x, c.y, PIXEL, PIXEL);
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();

    return function() {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        position: 'absolute',
        inset: 0
      }}
    />
  );
}

export default NeonPixelBackground;
