import { useState } from 'react';
import './App.css';

function App() {
  const [test] = useState("Hello from Sermon Library!");
  
  return (
    <div className="app">
      <h1>{test}</h1>
      <p>Testing basic React functionality...</p>
    </div>
  );
}

export default App;
