import { Router } from 'express'
import { supabase } from '../supabaseClient.js'

const router = Router()

router.post('/check-in', async (req, res) => {
  const registrationId = (req.body?.registrationId || '').trim()
  if (!registrationId) return res.status(400).json({ error: 'Enter your registration ID.' })

  const { data: registration } = await supabase
    .from('registrations')
    .select('registration_id, full_name')
    .eq('registration_id', registrationId)
    .maybeSingle()

  if (!registration) {
    return res.status(404).json({ error: 'Registration ID not found.' })
  }

  const { data: existing } = await supabase
    .from('attendance')
    .select('registration_id')
    .eq('registration_id', registrationId)
    .maybeSingle()

  if (existing) {
    return res.status(200).json({ alreadyCheckedIn: true, fullName: registration.full_name })
  }

  const { error: insertError } = await supabase.from('attendance').insert({
    registration_id: registrationId,
    attendance_status: 'present',
    manual: false,
  })

  if (insertError) {
    console.error(insertError)
    return res.status(500).json({ error: 'Could not record attendance. Please try again.' })
  }

  res.json({ success: true, fullName: registration.full_name })
})

router.post('/check-out', async (req, res) => {
  const registrationId = (req.body?.registrationId || '').trim()
  if (!registrationId) return res.status(400).json({ error: 'Enter your registration ID.' })

  const { data: registration } = await supabase
    .from('registrations')
    .select('registration_id, full_name')
    .eq('registration_id', registrationId)
    .maybeSingle()

  if (!registration) {
    return res.status(404).json({ error: 'Registration ID not found.' })
  }

  const { data: attendance } = await supabase
    .from('attendance')
    .select('registration_id, checked_out_at')
    .eq('registration_id', registrationId)
    .maybeSingle()

  if (!attendance) {
    return res.status(400).json({ error: "You haven't checked in yet, so there's nothing to check out from." })
  }

  if (attendance.checked_out_at) {
    return res.status(200).json({ alreadyCheckedOut: true, fullName: registration.full_name })
  }

  const { error: updateError } = await supabase
    .from('attendance')
    .update({ checked_out_at: new Date().toISOString() })
    .eq('registration_id', registrationId)

  if (updateError) {
    console.error(updateError)
    return res.status(500).json({ error: 'Could not record check-out. Please try again.' })
  }

  res.json({ success: true, fullName: registration.full_name })
})

export default router
