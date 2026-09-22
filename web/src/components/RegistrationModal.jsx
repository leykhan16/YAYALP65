import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../api'
import './RegistrationModal.css'

const initialForm = {
  fullName: '', phone: '', whatsapp: '', email: '',
  parish: '', area: '', zone: '', familyId: '', department: '', unit: '',
}
const required = ['fullName', 'phone', 'email', 'parish', 'area', 'zone', 'familyId', 'department']

export default function RegistrationModal({ open, onClose }) {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [families, setFamilies] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (open) {
      api.getFamilies().then(setFamilies).catch(() => setServerError('Could not load families. Is the backend running?'))
    }
  }, [open])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function validate() {
    const errs = {}
    required.forEach((field) => { if (!form[field].trim()) errs[field] = 'Required' })
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')
    if (!validate()) return
    setSubmitting(true)
    try {
      const data = await api.register(form)
      setResult({ registrationId: data.registrationId, fullName: data.fullName })
    } catch (err) {
      setServerError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    setForm(initialForm); setErrors({}); setResult(null); setServerError('')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose}>
          <motion.div className="modal-card" initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.96 }} transition={{ duration: 0.3 }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleClose} aria-label="Close">&times;</button>

            {!result ? (
              <>
                <p className="eyebrow">Convention Registration</p>
                <h2 className="section-title modal-title">Reserve your place</h2>
                {serverError && <p className="form-error">{serverError}</p>}
                <form className="reg-form" onSubmit={handleSubmit} noValidate>
                  <Field label="Full Name" name="fullName" form={form} errors={errors} onChange={handleChange} />
                  <Field label="Phone Number" name="phone" form={form} errors={errors} onChange={handleChange} />
                  <Field label="WhatsApp Number" name="whatsapp" form={form} errors={errors} onChange={handleChange} optional />
                  <Field label="Email" name="email" type="email" form={form} errors={errors} onChange={handleChange} />
                  <Field label="Parish" name="parish" form={form} errors={errors} onChange={handleChange} />
                  <Field label="Area" name="area" form={form} errors={errors} onChange={handleChange} />
                  <Field label="Zone" name="zone" form={form} errors={errors} onChange={handleChange} />
                  <label className="field">
                    <span>Family<em>*</em></span>
                    <select name="familyId" value={form.familyId} onChange={handleChange}>
                      <option value="">Select family</option>
                      {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    {errors.familyId && <small className="field-error">{errors.familyId}</small>}
                  </label>
                  <Field label="Department" name="department" form={form} errors={errors} onChange={handleChange} />
                  <Field label="Unit" name="unit" form={form} errors={errors} onChange={handleChange} optional />
                  <button type="submit" className="btn-gold reg-submit" disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Complete Registration'}
                  </button>
                </form>
              </>
            ) : (
              <div className="reg-success">
                <p className="eyebrow">Registration Successful</p>
                <h2 className="section-title modal-title">You&rsquo;re on the list, {result.fullName.split(' ')[0]}!</h2>
                <div className="reg-id-box">{result.registrationId}</div>
                <p className="reg-note">
                  Save or screenshot this ID — you&rsquo;ll need it to check in at the venue.
                  A confirmation has been emailed to you as well.
                </p>
                <button className="btn-gold" onClick={handleClose}>Done</button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Field({ label, name, type = 'text', form, errors, onChange, optional }) {
  return (
    <label className="field">
      <span>{label}{!optional && <em>*</em>}</span>
      <input type={type} name={name} value={form[name]} onChange={onChange} />
      {errors[name] && <small className="field-error">{errors[name]}</small>}
    </label>
  )
}
