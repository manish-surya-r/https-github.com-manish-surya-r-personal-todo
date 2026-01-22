import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

console.log("Manish's Master Pulse: Engine Start...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Critical Error: Root container 'root' missing.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("Manish's Master Pulse: Render Complete.");
  } catch (err) {
    console.error("Initialization Failed:", err);
    rootElement.innerHTML = `
      <div style="padding: 40px; text-align: center; font-family: sans-serif; background: #fff1f2; color: #9f1239; border-radius: 20px; margin: 40px; border: 2px solid #fda4af;">
        <h2 style="font-weight: 900; margin-bottom: 10px;">Application Load Error</h2>
        <p style="opacity: 0.8;">The browser encountered an error while starting the app.</p>
        <pre style="text-align: left; background: #fff; padding: 15px; border-radius: 10px; margin-top: 20px; font-size: 12px; overflow: auto;">${err instanceof Error ? err.stack : String(err)}</pre>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #9f1239; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">Retry Boot Sequence</button>
      </div>`;
  }
}