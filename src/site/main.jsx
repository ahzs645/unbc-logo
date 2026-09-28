import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App.jsx'
// Deliberately not ../fonts.css: that declares the whole family for consuming apps, but the
// lockup's only text is the department line at weight 800. site.css loads just that one face.
import './site.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
