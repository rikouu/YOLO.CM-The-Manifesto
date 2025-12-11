import React, { useEffect, useRef } from 'react';

const MouseSpotlight: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<{ x: number; y: number }[]>([]);
  const mouseRef = useRef({ x: -100, y: -100 }); // Start off-screen

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    // New: Handle Touch Move
    const handleTouchMove = (e: TouchEvent) => {
        if(e.touches.length > 0) {
            mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    };

    // New: Handle Gravity/Tilt
    const handleOrientation = (e: DeviceOrientationEvent) => {
        if (e.gamma === null || e.beta === null) return;
        
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // Tilt Sensitivity
        const sensitivity = 25; 
        
        // Clamp values
        const tiltX = Math.min(Math.max(e.gamma, -sensitivity), sensitivity);
        const tiltY = Math.min(Math.max(e.beta - 45, -sensitivity), sensitivity);
        
        // Map to screen coordinates
        const x = centerX + (tiltX / sensitivity) * centerX;
        const y = centerY + (tiltY / sensitivity) * centerY;
        
        mouseRef.current = { x, y };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('deviceorientation', handleOrientation);

    // Initialize history with off-screen points to prevent initial streak
    for(let i=0; i<20; i++) {
        historyRef.current.push({ x: -100, y: -100 });
    }

    const render = () => {
      // Smooth trail: Push current mouse position to history
      historyRef.current.push({ ...mouseRef.current });
      if (historyRef.current.length > 25) {
        historyRef.current.shift();
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Large Ambient Spotlight (The "Flashlight" effect)
      const spotlightGradient = ctx.createRadialGradient(
        mouseRef.current.x,
        mouseRef.current.y,
        0,
        mouseRef.current.x,
        mouseRef.current.y,
        400
      );
      spotlightGradient.addColorStop(0, 'rgba(204, 255, 0, 0.05)'); // Very faint lime
      spotlightGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = spotlightGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. The Particles / Gradient Trail segments
      // We draw circles that get smaller and more transparent further back in history
      for (let i = 0; i < historyRef.current.length; i++) {
        const point = historyRef.current[i];
        // Skip off-screen initialization points
        if (point.x < 0) continue;

        // Ratio from 0 (oldest tail) to 1 (cursor tip)
        const indexRatio = i / historyRef.current.length; 
        
        const size = indexRatio * 8; // Grow size towards cursor
        const alpha = indexRatio * 0.8; // Increase opacity towards cursor

        ctx.beginPath();
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(204, 255, 0, ${alpha})`;
        
        // Add a neon glow to the newest points (the "head" of the cursor)
        if (i > historyRef.current.length - 5) {
             ctx.shadowBlur = 15;
             ctx.shadowColor = '#ccff00';
        } else {
             ctx.shadowBlur = 0;
        }
        
        ctx.fill();
        ctx.shadowBlur = 0; // Reset for next iteration
      }

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('deviceorientation', handleOrientation);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[100] mix-blend-difference"
      aria-hidden="true"
    />
  );
};

export default MouseSpotlight;