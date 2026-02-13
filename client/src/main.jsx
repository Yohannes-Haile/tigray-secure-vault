import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// If this line fails, the page stays blank
const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} else {
  console.error("CRITICAL ERROR: Cannot find element with id 'root' in index.html");
}