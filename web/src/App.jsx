import { useEffect, useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import EventDetails from './components/EventDetails'
import Ministers from './components/Ministers'
import Footer from './components/Footer'
import RegistrationModal from './components/RegistrationModal'

export default function App({ autoOpenRegister = false }) {
  const [registerOpen, setRegisterOpen] = useState(autoOpenRegister)

  useEffect(() => {
    if (autoOpenRegister) setRegisterOpen(true)
  }, [autoOpenRegister])

  return (
    <div className="app">
      <Header onRegisterClick={() => setRegisterOpen(true)} />
      <Hero onRegisterClick={() => setRegisterOpen(true)} />
      <EventDetails />
      <Ministers />
      <Footer onRegisterClick={() => setRegisterOpen(true)} />
      <RegistrationModal open={registerOpen} onClose={() => setRegisterOpen(false)} />
    </div>
  )
}
