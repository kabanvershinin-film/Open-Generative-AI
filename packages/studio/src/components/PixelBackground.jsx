import React, { useEffect, useRef } from 'react';

const PixelBackground = ({ className, text = 'OPEN\nGENERATIVE\nAI' }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let targetPixels = [];

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      // Обновляем целевые позиции пикселей (текст) при ресайзе
      updateTargetPixels();
    };

    const updateTargetPixels = () => {
      targetPixels = [];
      
      // Сначала рисуем текст на скрытом canvas, чтобы получить пиксели
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      const fontSize = Math.max(32, Math.min(canvas.width / 8, 72));
      tempCtx.font = `900 ${fontSize}px Inter, sans-serif`;
      tempCtx.textAlign = 'center';
      tempCtx.textBaseline = 'middle';
      tempCtx.fillStyle = '#ffffff';
      
      const lines = text.split('\n');
      const lineHeight = fontSize * 1.3;
      const totalTextHeight = lines.length * lineHeight;
      const startY = canvas.height / 2 - totalTextHeight / 2;
      
      lines.forEach((line, index) => {
        tempCtx.fillText(line, canvas.width / 2, startY + index * lineHeight);
      });
      
      // Считываем пиксели текста
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const pixelSize = 5;
      
      for (let y = 0; y < tempCanvas.height; y += pixelSize * 2) {
        for (let x = 0; x < tempCanvas.width; x += pixelSize * 2) {
          const index = (y * tempCanvas.width + x) * 4;
          const alpha = imageData.data[index + 3];
          
          if (alpha > 100) {
            targetPixels.push({ x, y });
          }
        }
      }
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const pixelSize = 5;
    const colors = [
      '#d946ef', // fuchsia
      '#a855f7', // purple
      '#7c3aed', // darker purple
      '#f0abfc', // light pink-purple
      '#c084fc', // light purple
      '#e879f9', // bright fuchsia
    ];

    // Создаем пиксели
    const pixels = [];
    const totalPixels = targetPixels.length + 600; // Текст + случайные
    
    for (let i = 0; i < totalPixels; i++) {
      const hasTarget = i < targetPixels.length;
      const target = hasTarget ? targetPixels[i] : null;
      
      pixels.push({
        // Начальная позиция: случайная
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        // Целевая позиция
        targetX: hasTarget ? target.x : Math.random() * canvas.width,
        targetY: hasTarget ? target.y : Math.random() * canvas.height,
        // Скорость
        vx: 0,
        vy: 0,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.9 + 0.1,
        hasTarget,
        phase: Math.random() * Math.PI * 2, // Для плавного движения
      });
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      pixels.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fillRect(
          Math.floor(p.x),
          Math.floor(p.y),
          pixelSize - 1,
          pixelSize - 1
        );

        if (p.hasTarget) {
          // Притягиваем к целевой позиции
          const dx = p.targetX - p.x;
          const dy = p.targetY - p.y;
          p.vx += dx * 0.015;
          p.vy += dy * 0.015;
          // Демпинг
          p.vx *= 0.95;
          p.vy *= 0.95;
        } else {
          // Случайное движение для остальных пикселей
          p.phase += 0.015;
          p.vx = Math.sin(p.phase) * 0.25;
          p.vy = Math.cos(p.phase * 0.8) * 0.25;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Ограничим позицию
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationId);
    };
  }, [text]);

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

export default PixelBackground;
