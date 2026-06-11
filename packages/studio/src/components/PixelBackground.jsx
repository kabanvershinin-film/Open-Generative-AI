import React, { useEffect, useRef } from 'react';

const PixelBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    let targetPixels = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
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
      
      const fontSize = Math.max(80, Math.min(canvas.width / 10, 120));
      tempCtx.font = `900 ${fontSize}px Inter, sans-serif`;
      tempCtx.textAlign = 'center';
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillText('OPEN', canvas.width / 2, canvas.height / 2 - fontSize);
      tempCtx.fillText('GENERATIVE', canvas.width / 2, canvas.height / 2);
      tempCtx.fillText('AI', canvas.width / 2, canvas.height / 2 + fontSize);
      
      // Считываем пиксели текста
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const pixelSize = 6;
      
      for (let y = 0; y < tempCanvas.height; y += pixelSize * 2) {
        for (let x = 0; x < tempCanvas.width; x += pixelSize * 2) {
          const index = (y * tempCanvas.width + x) * 4;
          const alpha = imageData.data[index + 3];
          
          if (alpha > 128) {
            targetPixels.push({ x, y });
          }
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const pixelSize = 6;
    const colors = [
      '#d946ef', // fuchsia
      '#a855f7', // purple
      '#7c3aed', // darker purple
      '#f0abfc', // light pink-purple
      '#c084fc', // light purple
    ];

    // Создаем пиксели
    const pixels = [];
    const totalPixels = targetPixels.length + 1000; // Текст + случайные
    
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

    const draw = (time) => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
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
          p.vx += dx * 0.02;
          p.vy += dy * 0.02;
          // Демпинг
          p.vx *= 0.92;
          p.vy *= 0.92;
        } else {
          // Случайное движение для остальных пикселей
          p.phase += 0.02;
          p.vx = Math.sin(p.phase) * 0.3;
          p.vy = Math.cos(p.phase * 0.7) * 0.3;
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
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};

export default PixelBackground;
