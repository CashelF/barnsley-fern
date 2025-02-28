import React from 'react';
import BarnsleyFern from './components/BarnsleyFern';
import './App.css';

function App() {
  return (
    <div className="App">
      <BarnsleyFern />
      <div className="info-overlay">
        <h1>Infinitely Zoomable Barnsley Fern</h1>
        <div className="instructions">
          <p>Scroll to zoom in/out</p>
          <p>Drag to pan</p>
          <p>Click "Reset View" to return to initial state</p>
        </div>
      </div>
    </div>
  );
}

export default App;
