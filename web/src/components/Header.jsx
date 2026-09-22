import rccgLogo from '../assets/rccg_logo.png'
import yayaLogo from '../assets/yaya_logo.png'
import './Header.css'

export default function Header({ onRegisterClick }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="brand">
          <img src={rccgLogo} alt="RCCG logo" className="brand-logo" />
          <img src={yayaLogo} alt="YAYA logo" className="brand-logo" />
          <span className="brand-text">Lagos Province 65 &middot; YAYA</span>
        </div>
        <nav className="site-nav">
          <a href="#details">Details</a>
          <a href="#ministers">Ministers</a>
          <button className="btn-gold nav-cta" onClick={onRegisterClick}>Register</button>
        </nav>
      </div>
    </header>
  )
}
