import React, { useRef, useEffect, useCallback } from 'react';

const Canvas = ({ isDrawer, onDraw, strokes = [] }) => {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastDrawnStrokesLen = useRef(0);

  // Resize canvas once on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    const ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 4;
  }, []);

  // Redraw strokes whenever they change
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 4;

    strokes.forEach(stroke => {
      if (!stroke.points || stroke.points.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    });
  }, [strokes]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handlePointerDown = useCallback((e) => {
    if (!isDrawer) return;
    e.preventDefault();
    isDrawingRef.current = true;
    const pos = getPos(e);
    onDraw(pos, 'start');
  }, [isDrawer, onDraw]);

  const handlePointerMove = useCallback((e) => {
    if (!isDrawer || !isDrawingRef.current) return;
    e.preventDefault();
    const pos = getPos(e);
    onDraw(pos, 'point');
  }, [isDrawer, onDraw]);

  const handlePointerUp = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '16px',
          background: 'white',
          cursor: isDrawer ? 'crosshair' : 'default',
          touchAction: 'none',
          display: 'block',
        }}
      />
      {isDrawer && (
        <button
          onClick={() => onDraw(null, 'clear')}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: '#f43f5e',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.85rem',
          }}
        >
          Clear
        </button>
      )}
      {!isDrawer && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(99,102,241,0.85)',
          color: 'white',
          padding: '6px 18px',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: 600,
          backdropFilter: 'blur(4px)',
        }}>
          Watch & Guess!
        </div>
      )}
    </div>
  );
};

export default Canvas;
