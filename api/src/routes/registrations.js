import { Router } from 'express'
import multer from 'multer'
import { supabase } from '../supabaseClient.js'
import { sendConfirmationEmail } from '../mailer.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

const required = ['fullName', 'phone', 'email', 'parish', 'area', 'zone', 'familyId', 'gender']

router.post('/', upload.single('passport'), async (req, res) => {
  const body = req.body || {}
  const missing = required.filter((f) => !body[f] || !String(body[f]).trim())
  if (missing.length) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` })
  }
  if (!/^\S+@\S+\.\S+$/.test(body.email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' })
  }
  if (!req.file) {
    return res.status(400).json({ error: 'A passport photograph is required.' })
  }
  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'Passport photo must be an image file.' })
  }

  const { data: counterData, error: counterError } = await supabase.rpc('next_registration_number')
  if (counterError) {
    console.error(counterError)
    return res.status(500).json({ error: 'Could not generate a registration ID. Please try again.' })
  }
  const registrationId = `YAYA65-26-${String(counterData).padStart(6, '0')}`

  const ext = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase()
  const filePath = `${registrationId}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('passports')
    .upload(filePath, req.file.buffer, { contentType: req.file.mimetype, upsert: true })

  if (uploadError) {
    console.error(uploadError)
    return res.status(500).json({ error: 'Passport photo could not be uploaded. Please try again.' })
  }
  const { data: urlData } = supabase.storage.from('passports').getPublicUrl(filePath)
  const passportUrl = urlData.publicUrl

  const { data, error } = await supabase
    .from('registrations')
    .insert({
      registration_id: registrationId,
      full_name: body.fullName.trim(),
      phone: body.phone.trim(),
      whatsapp: body.whatsapp?.trim() || null,
      email: body.email.trim(),
      parish: body.parish.trim(),
      area: body.area.trim(),
      zone: body.zone.trim(),
      family_id: body.familyId,
      department: body.department?.trim() || null,
      post_held: body.postHeld?.trim() || null,
      gender: body.gender.trim(),
      passport_url: passportUrl,
    })
    .select()
    .single()

  if (error) {
    console.error(error)
    return res.status(500).json({ error: 'Registration could not be saved. Please try again.' })
  }

  try {
    await sendConfirmationEmail(data.email, { fullName: data.full_name, registrationId })
  } catch (emailError) {
    console.error('Email send failed (registration still saved):', emailError)
  }

  res.status(201).json({ registrationId, fullName: data.full_name })
})

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('registrations')
    .select('registration_id, full_name, created_at')
    .eq('registration_id', req.params.id)
    .maybeSingle()
  if (error) return res.status(500).json({ error: 'Lookup failed.' })
  if (!data) return res.status(404).json({ error: 'Registration ID not found.' })
  res.json(data)
})

export default router
