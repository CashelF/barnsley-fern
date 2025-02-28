import React, { useState } from 'react';
import BarnsleyFern from './components/BarnsleyFern';
import './App.css';

function App() {
  const [showInfo, setShowInfo] = useState(true);

  return (
    <div className="App">
      <BarnsleyFern />
      
      {showInfo ? (
        <div className="info-overlay">
          <button 
            className="close-button" 
            onClick={() => setShowInfo(false)}
            aria-label="Close information panel"
          >
            ×
          </button>
          <h1>Interactive Barnsley Fern</h1>
          <div className="instructions">
            <p>Scroll to zoom in/out</p>
            <p>Drag to pan</p>
            <p>Click "Edit Coefficients" to modify the fern's equations</p>
          </div>
        </div>
      ) : (
        <button 
          className="info-toggle-button" 
          onClick={() => setShowInfo(true)}
          aria-label="Show information"
        >
          i
        </button>
      )}
    </div>
  );
}

export default App;
