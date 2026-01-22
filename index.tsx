import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Initializing Manish's Master Pulse...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Critical Error: Could not find root element to mount to.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    console.error("Initialization Failed:", err);
    rootElement.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;">
      <h2>Application Failed to Load</h2>
      <p>Please check the browser console for details.</p>
    </div>`;
  }
}