import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Connect React to the <div id="root"></div> in index.html
const rootElement = document.getElementById('root') as HTMLElement

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
