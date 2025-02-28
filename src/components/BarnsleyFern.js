import React, { useRef, useEffect, useState, useCallback } from 'react';
import './BarnsleyFern.css';

// Default Barnsley Fern coefficients
const defaultCoefficients = {
  f1: { a: 0, b: 0, c: 0, d: 0.16, e: 0, f: 0, p: 0.01 },
  f2: { a: 0.85, b: 0.04, c: -0.04, d: 0.85, e: 0, f: 1.6, p: 0.85 },
  f3: { a: 0.2, b: -0.26, c: 0.23, d: 0.22, e: 0, f: 1.6, p: 0.07 },
  f4: { a: -0.15, b: 0.28, c: 0.26, d: 0.24, e: 0, f: 0.44, p: 0.07 }
};

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
  
  // Double-tap zoom states
  const [lastTap, setLastTap] = useState(0);
  const [isZoomDrag, setIsZoomDrag] = useState(false);
  const [zoomDragOrigin, setZoomDragOrigin] = useState({ x: 0, y: 0 });
  const [zoomDragFactor, setZoomDragFactor] = useState(1);
  const doubleTapDelay = 300; // ms between taps to be considered a double-tap
  
  // Coefficient editor states
  const [showCoefficients, setShowCoefficients] = useState(false);
  const [coefficients, setCoefficients] = useState(defaultCoefficients);
  const [selectedFunction, setSelectedFunction] = useState('f2');
  const coefficientUpdateTimer = useRef(null);

  // Generate Barnsley Fern points using current coefficients
  const generatePoints = useCallback(() => {
    const newPoints = [];
    let x = 0;
    let y = 0;

    // Calculate probability thresholds
    const p1 = coefficients.f1.p;
    const p2 = p1 + coefficients.f2.p;
    const p3 = p2 + coefficients.f3.p;
    // p4 is implicit (1.0)

    for (let i = 0; i < renderCount; i++) {
      const r = Math.random();
      let nextX, nextY;

      if (r < p1) {
        // Function 1 (typically stem)
        const { a, b, c, d, e, f } = coefficients.f1;
        nextX = a * x + b * y + e;
        nextY = c * x + d * y + f;
      } else if (r < p2) {
        // Function 2 (typically successively smaller leaflets)
        const { a, b, c, d, e, f } = coefficients.f2;
        nextX = a * x + b * y + e;
        nextY = c * x + d * y + f;
      } else if (r < p3) {
        // Function 3 (typically largest left-hand leaflet)
        const { a, b, c, d, e, f } = coefficients.f3;
        nextX = a * x + b * y + e;
        nextY = c * x + d * y + f;
      } else {
        // Function 4 (typically largest right-hand leaflet)
        const { a, b, c, d, e, f } = coefficients.f4;
        nextX = a * x + b * y + e;
        nextY = c * x + d * y + f;
      }

      x = nextX;
      y = nextY;
      
      // Skip the first few points as they may be outliers
      if (i > 20) {
        newPoints.push({ x, y });
      }
    }

    setPoints(newPoints);
  }, [renderCount, coefficients]);

  // Generate points when coefficients or render count changes
  useEffect(() => {
    generatePoints();
  }, [generatePoints]);

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

  // Function to perform zoom based on position and factor
  const performZoom = (centerX, centerY, zoomFactor) => {
    // Get canvas dimensions
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Convert touch center to canvas coordinates
    const canvasX = centerX - rect.left;
    const canvasY = centerY - rect.top;
    
    // Calculate world coordinates of touch center
    const centerCanvasX = rect.width / 2;
    const centerCanvasY = rect.height / 2;
    
    const oldWorldTouchX = (canvasX - centerCanvasX - offsetX) / scale;
    const oldWorldTouchY = (centerCanvasY - canvasY + offsetY) / scale;
    
    // Calculate new scale
    const newScale = scale * zoomFactor;
    
    // Calculate new world coordinates and adjust offset
    const newWorldTouchX = (canvasX - centerCanvasX - offsetX) / newScale;
    const newWorldTouchY = (centerCanvasY - canvasY + offsetY) / newScale;
    
    // Adjust offset to keep the point under the touch fixed
    const offsetXDelta = (oldWorldTouchX - newWorldTouchX) * newScale;
    const offsetYDelta = (oldWorldTouchY - newWorldTouchY) * newScale;
    
    // Update state
    setScale(newScale);
    setOffsetX(offsetX + offsetXDelta);
    setOffsetY(offsetY + offsetYDelta);
    
    // Increase point count when zooming in
    if (newScale > 200 && renderCount < 50000) {
      setRenderCount(50000);
    } else if (newScale > 1000 && renderCount < 100000) {
      setRenderCount(100000);
    }
  };

  // Handle touch events for mobile devices
  const handleTouchStart = (e) => {
    e.preventDefault(); // Prevent default browser actions
    
    const now = Date.now();
    
    if (e.touches.length === 1) {
      // Check if this is a double tap
      if (now - lastTap < doubleTapDelay) {
        // This is a double tap - initialize zoom drag mode
        setIsZoomDrag(true);
        setZoomDragOrigin({
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        });
        setZoomDragFactor(1); // Start at no zoom change
      } else {
        // Single touch - prepare for normal dragging
        setIsDragging(true);
        setIsZoomDrag(false);
      }
      
      // Record touch position and time
      setStartDragX(e.touches[0].clientX);
      setStartDragY(e.touches[0].clientY);
      setLastTap(now);
      setLastTouchDistance(null);
    } 
    else if (e.touches.length === 2) {
      // Two touches - prepare for pinch zoom
      setIsDragging(false);
      setIsZoomDrag(false);
      setLastTouchDistance(getTouchDistance(e.touches));
      setLastZoomCenter(getTouchCenter(e.touches));
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault(); // Prevent default browser actions like scrolling
    
    if (e.touches.length === 1) {
      if (isZoomDrag) {
        // Handle zoom dragging (drag up to zoom in, down to zoom out)
        const touchY = e.touches[0].clientY;
        const deltaY = touchY - startDragY;
        
        // Calculate zoom factor based on vertical movement
        // Moving up (negative deltaY) zooms in, moving down zooms out
        // Use a gentle factor to control zoom speed
        const newZoomFactor = Math.max(0.5, Math.min(2.0, 1 - deltaY * 0.01));
        setZoomDragFactor(newZoomFactor);
        
        // Perform the zoom centered on the initial touch point
        performZoom(zoomDragOrigin.x, zoomDragOrigin.y, newZoomFactor);
        
        // Update drag position for next move
        setStartDragX(e.touches[0].clientX);
        setStartDragY(e.touches[0].clientY);
      } 
      else if (isDragging) {
        // Handle regular panning
        const deltaX = e.touches[0].clientX - startDragX;
        const deltaY = e.touches[0].clientY - startDragY;
        
        setOffsetX(offsetX + deltaX);
        setOffsetY(offsetY + deltaY);
        
        setStartDragX(e.touches[0].clientX);
        setStartDragY(e.touches[0].clientY);
      }
    } 
    else if (e.touches.length === 2) {
      // Handle standard pinch zoom
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
    // Reset interaction states
    if (e.touches.length === 0) {
      setIsDragging(false);
      setIsZoomDrag(false);
      setLastTouchDistance(null);
    } else if (e.touches.length === 1) {
      // If one touch remains after pinch, start dragging from there
      setIsDragging(true);
      setIsZoomDrag(false);
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
    setCoefficients(defaultCoefficients);
  };
  
  // Handle coefficient change
  const handleCoefficientChange = (func, param, value) => {
    // Update the coefficient
    const newValue = parseFloat(value);
    if (isNaN(newValue)) return;
    
    // Create a new coefficients object with the updated value
    const newCoefficients = {
      ...coefficients,
      [func]: {
        ...coefficients[func],
        [param]: newValue
      }
    };
    
    // Clear any pending updates
    if (coefficientUpdateTimer.current) {
      clearTimeout(coefficientUpdateTimer.current);
    }
    
    // Set the coefficients and schedule a regeneration of points
    setCoefficients(newCoefficients);
    
    // Debounce the point generation to avoid too many updates
    coefficientUpdateTimer.current = setTimeout(() => {
      generatePoints();
    }, 100);
  };
  
  // Toggle coefficient panel
  const toggleCoefficientPanel = () => {
    setShowCoefficients(!showCoefficients);
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
        <div className="buttons">
          <button onClick={handleReset}>Reset</button>
          <button onClick={toggleCoefficientPanel}>
            {showCoefficients ? 'Hide Editor' : 'Edit Coefficients'}
          </button>
        </div>
        <div className="info">
          <p>Zoom: {scale.toFixed(1)}x</p>
          <p>Points: {renderCount}</p>
        </div>
      </div>
      
      {showCoefficients && (
        <div className="coefficient-panel">
          <div className="coefficient-tabs">
            <button 
              className={selectedFunction === 'f1' ? 'active' : ''} 
              onClick={() => setSelectedFunction('f1')}
            >
              Stem (f₁)
            </button>
            <button 
              className={selectedFunction === 'f2' ? 'active' : ''} 
              onClick={() => setSelectedFunction('f2')}
            >
              Main Leaflets (f₂)
            </button>
            <button 
              className={selectedFunction === 'f3' ? 'active' : ''} 
              onClick={() => setSelectedFunction('f3')}
            >
              Left Leaflet (f₃)
            </button>
            <button 
              className={selectedFunction === 'f4' ? 'active' : ''} 
              onClick={() => setSelectedFunction('f4')}
            >
              Right Leaflet (f₄)
            </button>
          </div>
          
          <div className="coefficient-sliders">
            <div className="coefficient">
              <label>a:</label>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={coefficients[selectedFunction].a}
                onChange={(e) => handleCoefficientChange(selectedFunction, 'a', e.target.value)}
              />
              <span>{coefficients[selectedFunction].a.toFixed(2)}</span>
            </div>
            <div className="coefficient">
              <label>b:</label>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={coefficients[selectedFunction].b}
                onChange={(e) => handleCoefficientChange(selectedFunction, 'b', e.target.value)}
              />
              <span>{coefficients[selectedFunction].b.toFixed(2)}</span>
            </div>
            <div className="coefficient">
              <label>c:</label>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={coefficients[selectedFunction].c}
                onChange={(e) => handleCoefficientChange(selectedFunction, 'c', e.target.value)}
              />
              <span>{coefficients[selectedFunction].c.toFixed(2)}</span>
            </div>
            <div className="coefficient">
              <label>d:</label>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={coefficients[selectedFunction].d}
                onChange={(e) => handleCoefficientChange(selectedFunction, 'd', e.target.value)}
              />
              <span>{coefficients[selectedFunction].d.toFixed(2)}</span>
            </div>
            <div className="coefficient">
              <label>e:</label>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={coefficients[selectedFunction].e}
                onChange={(e) => handleCoefficientChange(selectedFunction, 'e', e.target.value)}
              />
              <span>{coefficients[selectedFunction].e.toFixed(2)}</span>
            </div>
            <div className="coefficient">
              <label>f:</label>
              <input
                type="range"
                min="-5"
                max="5"
                step="0.1"
                value={coefficients[selectedFunction].f}
                onChange={(e) => handleCoefficientChange(selectedFunction, 'f', e.target.value)}
              />
              <span>{coefficients[selectedFunction].f.toFixed(2)}</span>
            </div>
            <div className="coefficient">
              <label>p:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={coefficients[selectedFunction].p}
                onChange={(e) => handleCoefficientChange(selectedFunction, 'p', e.target.value)}
              />
              <span>{coefficients[selectedFunction].p.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="equation-display">
            <h3>Current Transformation:</h3>
            <p>
              f<sub>{selectedFunction.charAt(1)}</sub>(x,y) = (
              {coefficients[selectedFunction].a >= 0 ? ' ' : ''}
              {coefficients[selectedFunction].a.toFixed(2)}x + 
              {coefficients[selectedFunction].b >= 0 ? ' ' : ''}
              {coefficients[selectedFunction].b.toFixed(2)}y + 
              {coefficients[selectedFunction].e >= 0 ? ' ' : ''}
              {coefficients[selectedFunction].e.toFixed(2)}, 
              {coefficients[selectedFunction].c >= 0 ? ' ' : ''}
              {coefficients[selectedFunction].c.toFixed(2)}x + 
              {coefficients[selectedFunction].d >= 0 ? ' ' : ''}
              {coefficients[selectedFunction].d.toFixed(2)}y + 
              {coefficients[selectedFunction].f >= 0 ? ' ' : ''}
              {coefficients[selectedFunction].f.toFixed(2)})
            </p>
            <p>Probability: {(coefficients[selectedFunction].p * 100).toFixed(1)}%</p>
          </div>
        </div>
      )}
      
      <div className="info-button">
        <button onClick={() => alert("Barnsley Fern uses four affine transformations to create a fractal pattern.\n\nEach transformation has the form:\n(x,y) → (ax + by + e, cx + dy + f)\n\nBy adjusting these coefficients, you can create various fern-like patterns and other fractals. Experiment with the sliders to see how each parameter affects the shape.")}>?</button>
      </div>
    </div>
  );
};

export default BarnsleyFern;