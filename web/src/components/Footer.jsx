import rccgLogo from '../assets/rccg_logo.png'
import yayaLogo from '../assets/yaya_logo.png'
import './Footer.css'

export default function Footer({ onRegisterClick }) {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-logos">
          <img src={rccgLogo} alt="RCCG logo" />
          <img src={yayaLogo} alt="YAYA logo" />
        </div>
        <p className="footer-org">The Redeemed Christian Church of God &middot; Lagos Province 65 &middot; Young Adults &amp; Youths</p>
        <p className="footer-handle">@rccglp65yaya_ &middot; #ANTICIPATE</p>
        <button className="btn-gold footer-cta" onClick={onRegisterClick}>Register Now</button>
      </div>
    </footer>
  )
}
