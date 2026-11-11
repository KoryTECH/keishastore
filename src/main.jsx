import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

// The #splash overlay lives OUTSIDE #root (React leaves it alone).
// Fade it out once the first frame has actually painted — two
// rAFs guarantee the commit landed in between.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    const splash = document.getElementById('splash')
    if (!splash) return
    splash.classList.add('hide')
    setTimeout(() => splash.remove(), 400)
  })
})
