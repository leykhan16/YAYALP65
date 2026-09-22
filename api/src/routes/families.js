import { Router } from 'express'
import { supabase } from '../supabaseClient.js'

const router = Router()

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('families').select('id, name').order('name')
  if (error) return res.status(500).json({ error: 'Could not load families.' })
  res.json(data)
})

export default router
