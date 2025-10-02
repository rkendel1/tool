import React, { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 App1 - React Example</h1>
        <p>Welcome to the Mono Web IDE!</p>
        
        <div className="counter-section">
          <h2>Counter Demo</h2>
          <p className="counter-display">Count: {count}</p>
          <div className="button-group">
            <button onClick={() => setCount(count + 1)}>
              Increment
            </button>
            <button onClick={() => setCount(count - 1)}>
              Decrement
            </button>
            <button onClick={() => setCount(0)}>
              Reset
            </button>
          </div>
        </div>

        <div className="info-section">
          <h3>Features Available:</h3>
          <ul>
            <li>✅ Hot reload enabled</li>
            <li>✅ AI code completion active</li>
            <li>✅ Running on port 3000</li>
            <li>✅ Persistent storage</li>
          </ul>
        </div>

        <div className="next-steps">
          <h3>Next Steps:</h3>
          <p>Try editing this file and see the changes instantly!</p>
          <p>Open app2 in another terminal to run multiple apps.</p>
        </div>
      </header>
    </div>
  );
}

export default App;
