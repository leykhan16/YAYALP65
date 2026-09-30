import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { supabase } from '../supabaseClient.js'
import { requireAdmin } from '../authMiddleware.js'

const router = Router()

router.post('/login', (req, res) => {
  const { password, name } = req.body || {}
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password.' })
  }
  const token = jwt.sign({ name: name || 'Admin' }, process.env.JWT_SECRET, { expiresIn: '12h' })
  res.json({ token, name: name || 'Admin' })
})

router.use(requireAdmin)

async function loadAll() {
  const [{ data: families }, { data: registrations }, { data: attendance }] = await Promise.all([
    supabase.from('families').select('*').order('name'),
    supabase.from('registrations').select('*').order('created_at', { ascending: false }),
    supabase.from('attendance').select('*').order('checked_in_at', { ascending: false }),
  ])
  return { families: families || [], registrations: registrations || [], attendance: attendance || [] }
}

function genderBreakdown(list) {
  const male = list.filter((r) => (r.gender || '').toLowerCase() === 'male').length
  const female = list.filter((r) => (r.gender || '').toLowerCase() === 'female').length
  const unspecified = list.length - male - female
  const total = list.length
  const pct = (n) => (total ? Math.round((n / total) * 1000) / 10 : 0)
  return {
    male, female, unspecified,
    malePct: pct(male), femalePct: pct(female), unspecifiedPct: pct(unspecified),
  }
}

router.get('/dashboard', async (req, res) => {
  const { families, registrations, attendance } = await loadAll()
  const totalRegistrations = registrations.length
  const totalPresent = attendance.length
  const totalNotPresent = totalRegistrations - totalPresent
  const totalCheckedOut = attendance.filter((a) => a.checked_out_at).length
  const stillOnsite = totalPresent - totalCheckedOut
  const attendanceRate = totalRegistrations ? Math.round((totalPresent / totalRegistrations) * 1000) / 10 : 0

  const presentIds = new Set(attendance.map((a) => a.registration_id))
  const presentRegistrations = registrations.filter((r) => presentIds.has(r.registration_id))
  const genderRegistered = genderBreakdown(registrations)
  const genderPresent = genderBreakdown(presentRegistrations)

  const recentRegistrations = registrations.slice(0, 6).map((r) => ({
    registrationId: r.registration_id, fullName: r.full_name, createdAt: r.created_at,
  }))
  const recentCheckIns = attendance.slice(0, 6).map((a) => {
    const reg = registrations.find((r) => r.registration_id === a.registration_id)
    return { registrationId: a.registration_id, fullName: reg?.full_name || a.registration_id, checkedInAt: a.checked_in_at, manual: a.manual }
  })

  res.json({
    totalRegistrations, totalPresent, totalNotPresent, totalCheckedOut, stillOnsite, attendanceRate,
    totalFamilies: families.length, recentRegistrations, recentCheckIns,
    genderRegistered, genderPresent,
  })
})

router.get('/registrations', async (req, res) => {
  const { families, registrations, attendance } = await loadAll()
  const presentIds = new Set(attendance.map((a) => a.registration_id))
  const familyNameById = Object.fromEntries(families.map((f) => [f.id, f.name]))
  const { search = '', familyId, parish, area, zone, department, status } = req.query

  let rows = registrations.map((r) => ({
    registrationId: r.registration_id, fullName: r.full_name, phone: r.phone,
    whatsapp: r.whatsapp, email: r.email, parish: r.parish, area: r.area, zone: r.zone,
    familyId: r.family_id, familyName: familyNameById[r.family_id] || 'Unassigned',
    department: r.department, postHeld: r.post_held, gender: r.gender, passportUrl: r.passport_url,
    createdAt: r.created_at,
    attendanceStatus: presentIds.has(r.registration_id) ? 'present' : 'not-present',
  }))

  const term = String(search).toLowerCase().trim()
  if (term) {
    rows = rows.filter((r) =>
      [r.registrationId, r.fullName, r.phone, r.whatsapp, r.email].some((v) => (v || '').toLowerCase().includes(term))
    )
  }
  if (familyId) rows = rows.filter((r) => r.familyId === familyId)
  if (parish) rows = rows.filter((r) => r.parish === parish)
  if (area) rows = rows.filter((r) => r.area === area)
  if (zone) rows = rows.filter((r) => r.zone === zone)
  if (department) rows = rows.filter((r) => r.department === department)
  if (status) rows = rows.filter((r) => r.attendanceStatus === status)

  rows.sort((a, b) => a.registrationId.localeCompare(b.registrationId, undefined, { numeric: true }))

  res.json(rows)
})

router.get('/attendance', async (req, res) => {
  const { families, registrations, attendance } = await loadAll()
  const regById = Object.fromEntries(registrations.map((r) => [r.registration_id, r]))
  const familyNameById = Object.fromEntries(families.map((f) => [f.id, f.name]))
  const { search = '', familyId } = req.query

  let rows = attendance.map((a) => {
    const reg = regById[a.registration_id] || {}
    return {
      registrationId: a.registration_id, fullName: reg.full_name || '(unknown)',
      familyId: reg.family_id || null, familyName: familyNameById[reg.family_id] || 'Unassigned',
      checkedInAt: a.checked_in_at, manual: a.manual,
      checkedOutAt: a.checked_out_at || null,
    }
  })

  const term = String(search).toLowerCase().trim()
  if (term) {
    rows = rows.filter((r) => [r.registrationId, r.fullName].some((v) => (v || '').toLowerCase().includes(term)))
  }
  if (familyId) rows = rows.filter((r) => r.familyId === familyId)

  rows.sort((a, b) => a.registrationId.localeCompare(b.registrationId, undefined, { numeric: true }))

  res.json(rows)
})

router.post('/attendance/manual', async (req, res) => {
  const registrationId = (req.body?.registrationId || '').trim()
  if (!registrationId) return res.status(400).json({ error: 'Enter a registration ID.' })

  const { data: registration } = await supabase
    .from('registrations').select('registration_id, full_name').eq('registration_id', registrationId).maybeSingle()
  if (!registration) return res.status(404).json({ error: 'Registration ID not found.' })

  const { data: existing } = await supabase
    .from('attendance').select('registration_id').eq('registration_id', registrationId).maybeSingle()
  if (existing) return res.status(200).json({ alreadyCheckedIn: true, fullName: registration.full_name })

  const { error } = await supabase.from('attendance').insert({
    registration_id: registrationId, attendance_status: 'present', manual: true, marked_by: req.admin?.name || 'Admin',
  })
  if (error) return res.status(500).json({ error: 'Could not record attendance.' })

  await supabase.from('audit_logs').insert({
    action: 'manual_check_in', target: registrationId, admin_name: req.admin?.name || 'Admin',
    metadata: { fullName: registration.full_name },
  })

  res.json({ success: true, fullName: registration.full_name })
})

router.post('/attendance/manual-checkout', async (req, res) => {
  const registrationId = (req.body?.registrationId || '').trim()
  if (!registrationId) return res.status(400).json({ error: 'Enter a registration ID.' })

  const { data: registration } = await supabase
    .from('registrations').select('registration_id, full_name').eq('registration_id', registrationId).maybeSingle()
  if (!registration) return res.status(404).json({ error: 'Registration ID not found.' })

  const { data: attendance } = await supabase
    .from('attendance').select('registration_id, checked_out_at').eq('registration_id', registrationId).maybeSingle()
  if (!attendance) return res.status(400).json({ error: 'This person has not checked in yet.' })
  if (attendance.checked_out_at) return res.status(200).json({ alreadyCheckedOut: true, fullName: registration.full_name })

  const { error } = await supabase
    .from('attendance')
    .update({ checked_out_at: new Date().toISOString() })
    .eq('registration_id', registrationId)
  if (error) return res.status(500).json({ error: 'Could not record check-out.' })

  await supabase.from('audit_logs').insert({
    action: 'manual_check_out', target: registrationId, admin_name: req.admin?.name || 'Admin',
    metadata: { fullName: registration.full_name },
  })

  res.json({ success: true, fullName: registration.full_name })
})

router.post('/broadcast-email/test', async (req, res) => {
  const { email, subject, message } = req.body || {}
  if (!email || !email.trim()) return res.status(400).json({ error: 'Enter an email address to send the test to.' })
  if (!subject || !subject.trim() || !message || !message.trim()) {
    return res.status(400).json({ error: 'Subject and message are both required.' })
  }

  const { sendBroadcastEmail } = await import('../mailer.js')
  try {
    await sendBroadcastEmail(email.trim(), {
      fullName: req.admin?.name || 'Admin',
      subject: `[TEST] ${subject.trim()}`,
      message: message.trim(),
    })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Test email could not be sent. Check the address and try again.' })
  }
})

async function sendBatch(recipients, subject, message, adminName) {
  const { sendBroadcastEmail } = await import('../mailer.js')
  let sent = 0
  let failed = 0
  const failedList = []
  const failedErrors = []

  for (const r of recipients) {
    try {
      await sendBroadcastEmail(r.email, { fullName: r.full_name, subject, message })
      sent++
    } catch (err) {
      console.error(`Broadcast failed for ${r.registration_id}:`, err.message)
      failed++
      failedList.push({ registrationId: r.registration_id, email: r.email, fullName: r.full_name })
      failedErrors.push(err.message)
    }
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  const { data: log } = await supabase.from('audit_logs').insert({
    action: 'broadcast_email', target: 'all_registrants', admin_name: adminName,
    metadata: {
      subject, message, sent, failed, totalRecipients: recipients.length,
      failedRecipients: failedList, lastError: failedErrors[failedErrors.length - 1] || null,
    },
  }).select().single()

  return { sent, failed, totalRecipients: recipients.length, failedList, logId: log?.id }
}

router.post('/broadcast-email', async (req, res) => {
  const { subject, message } = req.body || {}
  if (!subject || !subject.trim() || !message || !message.trim()) {
    return res.status(400).json({ error: 'Subject and message are both required.' })
  }

  const { data: registrations, error } = await supabase
    .from('registrations')
    .select('registration_id, full_name, email')
    .not('email', 'is', null)

  if (error) return res.status(500).json({ error: 'Could not load recipient list.' })

  const recipients = registrations.filter((r) => r.email && r.email.trim())
  const adminName = req.admin?.name || 'Admin'

  const { data: pendingLog } = await supabase.from('audit_logs').insert({
    action: 'broadcast_email', target: 'all_registrants', admin_name: adminName,
    metadata: { subject: subject.trim(), message: message.trim(), status: 'in_progress', totalRecipients: recipients.length, sent: 0, failed: 0 },
  }).select().single()

  res.json({ started: true, logId: pendingLog?.id, totalRecipients: recipients.length })

  sendBatch(recipients, subject.trim(), message.trim(), adminName, pendingLog?.id).catch((err) => {
    console.error('Broadcast batch crashed:', err)
  })
})

router.post('/broadcast-email/retry/:logId', async (req, res) => {
  const { data: log } = await supabase.from('audit_logs').select('*').eq('id', req.params.logId).maybeSingle()
  if (!log || !log.metadata?.failedRecipients?.length) {
    return res.status(400).json({ error: 'No failed recipients found for that broadcast.' })
  }

  const recipients = log.metadata.failedRecipients
  const adminName = req.admin?.name || 'Admin'

  const { data: pendingLog } = await supabase.from('audit_logs').insert({
    action: 'broadcast_email', target: 'retry', admin_name: adminName,
    metadata: { subject: log.metadata.subject, message: log.metadata.message, status: 'in_progress', totalRecipients: recipients.length, sent: 0, failed: 0 },
  }).select().single()

  res.json({ started: true, logId: pendingLog?.id, totalRecipients: recipients.length })

  sendBatch(recipients, log.metadata.subject, log.metadata.message, adminName, pendingLog?.id).catch((err) => {
    console.error('Broadcast retry crashed:', err)
  })
})

router.get('/broadcast-history', async (req, res) => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('action', 'broadcast_email')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: 'Could not load broadcast history.' })

  const rows = data.map((log) => ({
    id: log.id,
    subject: log.metadata?.subject || '(no subject)',
    sent: log.metadata?.sent ?? 0,
    failed: log.metadata?.failed ?? 0,
    totalRecipients: log.metadata?.totalRecipients ?? 0,
    status: log.metadata?.status || 'complete',
    adminName: log.admin_name,
    sentAt: log.created_at,
  }))

  res.json(rows)
})

router.get('/families', async (req, res) => {
  const { families, registrations, attendance } = await loadAll()
  const presentIds = new Set(attendance.map((a) => a.registration_id))
  const rows = families.map((f) => {
    const members = registrations.filter((r) => r.family_id === f.id)
    const present = members.filter((m) => presentIds.has(m.registration_id)).length
    const total = members.length
    return {
      id: f.id, name: f.name, code: f.code,
      registered: total, present, notPresent: total - present,
      rate: total ? Math.round((present / total) * 1000) / 10 : 0,
    }
  })
  res.json(rows)
})

router.get('/families/:id', async (req, res) => {
  const { families, registrations, attendance } = await loadAll()
  const family = families.find((f) => f.id === req.params.id)
  if (!family) return res.status(404).json({ error: 'Family not found.' })
  const presentIds = new Set(attendance.map((a) => a.registration_id))
  const members = registrations
    .filter((r) => r.family_id === family.id)
    .map((r) => ({
      registrationId: r.registration_id, fullName: r.full_name, phone: r.phone,
      email: r.email, gender: r.gender,
      attendanceStatus: presentIds.has(r.registration_id) ? 'present' : 'not-present',
    }))
  res.json({ family, members })
})

router.post('/families', async (req, res) => {
  const { name, code } = req.body || {}
  if (!name || !name.trim()) return res.status(400).json({ error: 'Family name is required.' })
  const { data, error } = await supabase.from('families').insert({ name: name.trim(), code: code?.trim() || null }).select().single()
  if (error) return res.status(500).json({ error: 'Could not create family (name may already exist).' })
  res.status(201).json(data)
})

router.delete('/registrations/:registrationId', async (req, res) => {
  const { registrationId } = req.params

  const { data: registration } = await supabase
    .from('registrations').select('registration_id, full_name').eq('registration_id', registrationId).maybeSingle()
  if (!registration) return res.status(404).json({ error: 'Registration not found.' })

  await supabase.from('attendance').delete().eq('registration_id', registrationId)

  const { error } = await supabase.from('registrations').delete().eq('registration_id', registrationId)
  if (error) {
    console.error(error)
    return res.status(500).json({ error: 'Could not delete registration.' })
  }

  await supabase.from('audit_logs').insert({
    action: 'delete_registration', target: registrationId, admin_name: req.admin?.name || 'Admin',
    metadata: { fullName: registration.full_name },
  })

  res.json({ success: true })
})

export default router
