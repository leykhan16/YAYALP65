import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import CheckIn from './CheckIn.jsx'
import CheckOut from './CheckOut.jsx'
import Admin from './admin/Admin.jsx'
import './index.css'

const path = window.location.pathname
let element

if (path.startsWith('/check-in')) {
  element = <CheckIn />
} else if (path.startsWith('/checkout') || path.startsWith('/check-out')) {
  element = <CheckOut />
} else if (path.startsWith('/admin')) {
  element = <Admin />
} else if (path.startsWith('/register')) {
  element = <App autoOpenRegister={true} />
} else {
  element = <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {element}
  </React.StrictMode>,
)
