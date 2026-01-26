import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app.tsx'
import './style.css' // Si tienes estilos

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)