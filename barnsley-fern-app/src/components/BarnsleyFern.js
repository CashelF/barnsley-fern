import React, { useRef, useEffect, useState } from 'react';
import './BarnsleyFern.css';

const BarnsleyFern = () => {
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(50);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startDragX, setStartDragX] = useState(0);
  const [startDragY, setStartDragY] = useState(0);
  const [points, setPoints] = useState([]);
  const [renderCount, setRenderCount] = useState(10000);
  const [lastTouchDistance, setLastTouchDistance] = useState(null);
  const [lastZoomCenter, setLastZoomCenter] = useState({ x: 0, y: 0 });

  // Generate Barnsley Fern points
  useEffect(() => {
    const generatePoints = () => {
      const newPoints = [];
      let x = 0;
      let y = 0;

      for (let i = 0; i < renderCount; i++) {
        const r = Math.random();
        let nextX, nextY;

        if (r < 0.01) {
          // Stem
          nextX = 0;
          nextY = 0.16 * y;
        } else if (r < 0.86) {
          // Successively smaller leaflets
          nextX = 0.85 * x + 0.04 * y;
          nextY = -0.04 * x + 0.85 * y + 1.6;
        } else if (r < 0.93) {
          // Largest left-hand leaflet
          nextX = 0.2 * x - 0.26 * y;
          nextY = 0.23 * x + 0.22 * y + 1.6;
        } else {
          // Largest right-hand leaflet
          nextX = -0.15 * x + 0.28 * y;
          nextY = 0.26 * x + 0.24 * y + 0.44;
        }

        x = nextX;
        y = nextY;
        
        // Skip the first few points as they may be outliers
        if (i > 20) {
          newPoints.push({ x, y });
        }
      }

      setPoints(newPoints);
    };

    generatePoints();
  }, [renderCount]);

  // Draw the fern on canvas
  useEffect(() => {
    if (!canvasRef.current || points.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Clear canvas
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw points
    ctx.fillStyle = '#0f0';
    
    // Calculate center of the canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    points.forEach(point => {
      // Transform point coordinates according to scale and offset
      const screenX = centerX + (point.x * scale) + offsetX;
      const screenY = centerY - (point.y * scale) + offsetY; // Flip Y because canvas Y grows downward
      
      // Draw a small dot for each point
      ctx.fillRect(screenX, screenY, 1, 1);
    });
  }, [points, scale, offsetX, offsetY]);

  // Handle mouse wheel for zooming
  const handleWheel = (e) => {
    e.preventDefault();
    
    // Get mouse position
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate position relative to the center with current scale and offset
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const oldWorldMouseX = (mouseX - centerX - offsetX) / scale;
    const oldWorldMouseY = (centerY - mouseY + offsetY) / scale;
    
    // Scrolling down (positive deltaY) zooms out, scrolling up (negative deltaY) zooms in
    const newScale = e.deltaY < 0 
      ? scale * 1.1  // Zoom in when scrolling up
      : scale / 1.1; // Zoom out when scrolling down
    
    // Calculate new screen position and adjust offset to maintain mouse position
    const newWorldMouseX = (mouseX - centerX - offsetX) / newScale;
    const newWorldMouseY = (centerY - mouseY + offsetY) / newScale;
    
    // Adjust offset to keep the point under the mouse fixed
    const offsetXDelta = (oldWorldMouseX - newWorldMouseX) * newScale;
    const offsetYDelta = (oldWorldMouseY - newWorldMouseY) * newScale;
    
    setScale(newScale);
    setOffsetX(offsetX + offsetXDelta);
    setOffsetY(offsetY + offsetYDelta);
    
    // If zooming in significantly, increase the number of points
    if (newScale > 200 && renderCount < 50000) {
      setRenderCount(50000);
    } else if (newScale > 1000 && renderCount < 100000) {
      setRenderCount(100000);
    }
  };

  // Handle mouse drag for panning
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartDragX(e.clientX);
    setStartDragY(e.clientY);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startDragX;
    const deltaY = e.clientY - startDragY;
    
    setOffsetX(offsetX + deltaX);
    setOffsetY(offsetY + deltaY); // Changed to match drag direction
    
    setStartDragX(e.clientX);
    setStartDragY(e.clientY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch event helper functions

  // Calculate distance between two touch points
  const getTouchDistance = (touches) => {
    if (touches.length < 2) return null;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Calculate center point between two touches
  const getTouchCenter = (touches) => {
    if (touches.length < 2) {
      return touches.length === 1 
        ? { x: touches[0].clientX, y: touches[0].clientY } 
        : { x: 0, y: 0 };
    }
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  };

  // Handle touch events for mobile devices
  const handleTouchStart = (e) => {
    e.preventDefault(); // Prevent default browser actions
    
    if (e.touches.length === 1) {
      // Single touch - prepare for dragging
      setIsDragging(true);
      setStartDragX(e.touches[0].clientX);
      setStartDragY(e.touches[0].clientY);
      setLastTouchDistance(null);
    } 
    else if (e.touches.length === 2) {
      // Two touches - prepare for pinch zoom
      setIsDragging(false);
      setLastTouchDistance(getTouchDistance(e.touches));
      setLastZoomCenter(getTouchCenter(e.touches));
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault(); // Prevent default browser actions like scrolling
    
    if (e.touches.length === 1 && isDragging) {
      // Handle single touch drag (panning)
      const deltaX = e.touches[0].clientX - startDragX;
      const deltaY = e.touches[0].clientY - startDragY;
      
      setOffsetX(offsetX + deltaX);
      setOffsetY(offsetY + deltaY);
      
      setStartDragX(e.touches[0].clientX);
      setStartDragY(e.touches[0].clientY);
    } 
    else if (e.touches.length === 2) {
      // Handle pinch zoom
      const newDistance = getTouchDistance(e.touches);
      const newCenter = getTouchCenter(e.touches);
      
      if (lastTouchDistance && newDistance) {
        // Calculate zoom factor from the change in distance between touches
        const factor = newDistance / lastTouchDistance;
        const newScale = scale * factor;
        
        // Get canvas dimensions
        const rect = canvasRef.current.getBoundingClientRect();
        
        // Convert touch center to canvas coordinates
        const canvasX = newCenter.x - rect.left;
        const canvasY = newCenter.y - rect.top;
        
        // Calculate world coordinates of touch center
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const oldWorldTouchX = (canvasX - centerX - offsetX) / scale;
        const oldWorldTouchY = (centerY - canvasY + offsetY) / scale;
        
        // Calculate new world coordinates and adjust offset
        const newWorldTouchX = (canvasX - centerX - offsetX) / newScale;
        const newWorldTouchY = (centerY - canvasY + offsetY) / newScale;
        
        // Adjust offset to keep the pinch center fixed
        const offsetXDelta = (oldWorldTouchX - newWorldTouchX) * newScale;
        const offsetYDelta = (oldWorldTouchY - newWorldTouchY) * newScale;
        
        // Update state
        setScale(newScale);
        setOffsetX(offsetX + offsetXDelta + (newCenter.x - lastZoomCenter.x));
        setOffsetY(offsetY + offsetYDelta + (newCenter.y - lastZoomCenter.y));
        
        // Increase point count when zooming in
        if (newScale > 200 && renderCount < 50000) {
          setRenderCount(50000);
        } else if (newScale > 1000 && renderCount < 100000) {
          setRenderCount(100000);
        }
      }
      
      // Update reference values for next move
      setLastTouchDistance(newDistance);
      setLastZoomCenter(newCenter);
    }
  };

  const handleTouchEnd = (e) => {
    // Reset dragging state only when all touches are gone or one left
    if (e.touches.length === 0) {
      setIsDragging(false);
      setLastTouchDistance(null);
    } else if (e.touches.length === 1) {
      // If one touch remains after pinch, start dragging from there
      setIsDragging(true);
      setStartDragX(e.touches[0].clientX);
      setStartDragY(e.touches[0].clientY);
      setLastTouchDistance(null);
    }
  };

  const handleReset = () => {
    setScale(50);
    setOffsetX(0);
    setOffsetY(0);
    setRenderCount(10000);
  };

  useEffect(() => {
    // Handle window resize
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="barnsley-fern-container">
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="barnsley-fern-canvas"
      />
      <div className="controls">
        <button onClick={handleReset}>Reset View</button>
        <div className="info">
          <p>Zoom: {scale.toFixed(1)}x</p>
          <p>Points: {renderCount}</p>
        </div>
      </div>
    </div>
  );
};

export default BarnsleyFern;