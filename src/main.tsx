import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css' 

// This connects the React code to the <div id="root"></div> in your index.html
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Failed to find the root element. Make sure index.html has <div id='root'></div>");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
