import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import CheckIn from './CheckIn.jsx'
import Admin from './admin/Admin.jsx'
import './index.css'

const path = window.location.pathname
let Page = App
if (path.startsWith('/check-in')) Page = CheckIn
else if (path.startsWith('/admin')) Page = Admin

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>,
)
