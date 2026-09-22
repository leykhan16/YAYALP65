import { motion } from 'framer-motion'
import adeyemiLevite from '../assets/adeyemi_levite.png'
import edodiongEssien from '../assets/edodiong_essien.png'
import preacherzkid from '../assets/preacherzkid.png'
import tosinOkunloye from '../assets/tosin_okunloye.png'
import tobilobaLonge from '../assets/tobiloba_longe.png'
import ministerRebecca from '../assets/minister_rebecca.png'
import ayotundeOlumide from '../assets/ayotunde_olumide.png'
import './Ministers.css'

const ministers = [
  { name: 'Dr. Adeyemi-Levite', img: adeyemiLevite },
  { name: 'Edodiong Essien', img: edodiongEssien },
  { name: 'Preacherzkid', img: preacherzkid },
  { name: 'Pastor Tosin Okunloye', img: tosinOkunloye },
  { name: 'Tobiloba Longe', img: tobilobaLonge },
  { name: 'Minister Rebecca', img: ministerRebecca },
  { name: 'Pastor Ayotunde Olumide', img: ayotundeOlumide },
]

export default function Ministers() {
  const loop = [...ministers, ...ministers]

  return (
    <section id="ministers" className="ministers-section">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7 }}
        >
          <p className="eyebrow">Guest Ministers</p>
          <h2 className="section-title">Voices carrying us on eagle&rsquo;s wings</h2>
        </motion.div>
      </div>

      <div className="ministers-marquee">
        <div className="ministers-track">
          {loop.map((m, i) => (
            <div className="minister-card" key={i}>
              <div className="minister-photo-wrap">
                <img src={m.img} alt={m.name} />
              </div>
              <span className="minister-badge">Guest</span>
              <h3>{m.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
