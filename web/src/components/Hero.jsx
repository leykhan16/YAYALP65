import { useState } from 'react'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import heroCover from '../assets/hero-cover.jpg'
import './Hero.css'

function TiltImage() {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useTransform(y, [-120, 120], [10, -10])
  const rotateY = useTransform(x, [-120, 120], [-10, 10])
  const springX = useSpring(rotateX, { stiffness: 150, damping: 18 })
  const springY = useSpring(rotateY, { stiffness: 150, damping: 18 })

  function handleMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    x.set(e.clientX - rect.left - rect.width / 2)
    y.set(e.clientY - rect.top - rect.height / 2)
  }
  function handleLeave() { x.set(0); y.set(0) }

  return (
    <div className="tilt-wrap">
      <motion.div
        className="tilt-card"
        style={{ rotateX: springX, rotateY: springY }}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        initial={{ opacity: 0, y: 40, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        <img src={heroCover} alt="On Eagle's Wings — YAYA Lagos Province 65 Convention" />
        <div className="tilt-glow" />
      </motion.div>
    </div>
  )
}

export default function Hero({ onRegisterClick }) {
  const [feathers] = useState(() =>
    Array.from({ length: 10 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 10 + Math.random() * 8,
      size: 10 + Math.random() * 14,
    }))
  )

  return (
    <section className="hero">
      <div className="hero-bg" />
      <div className="hero-particles">
        {feathers.map((f) => (
          <span
            key={f.id}
            className="feather"
            style={{
              left: `${f.left}%`,
              animationDelay: `${f.delay}s`,
              animationDuration: `${f.duration}s`,
              width: f.size,
              height: f.size,
            }}
          />
        ))}
      </div>

      <div className="container hero-inner">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9 }}
        >
          <p className="eyebrow hero-eyebrow">Lagos Province 65 · Young Adults &amp; Youth Affairs · 2026 Convention</p>
          <h1 className="hero-title">
            On <span className="gold-shimmer">Eagle&rsquo;s</span> Wings
          </h1>
          <p className="hero-verse">&ldquo;They that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles.&rdquo; &mdash; Isaiah 40:31</p>
          <div className="hero-pillars">
            {['Worship', 'Word', 'Connection', 'Transformation'].map((p) => (
              <span key={p} className="pillar-tag">{p}</span>
            ))}
          </div>
          <div className="hero-cta-row">
            <button className="btn-gold hero-cta" onClick={onRegisterClick}>Register Now</button>
            <a href="#details" className="hero-link">See convention details &rarr;</a>
          </div>
        </motion.div>

        <TiltImage />
      </div>
    </section>
  )
}
