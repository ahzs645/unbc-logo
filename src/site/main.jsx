import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App.jsx'
// Deliberately not ../fonts.css: that declares the whole family for consuming apps, but the site
// only draws the lockup's department line and the profile caption. site.css loads just those faces.
import './site.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
