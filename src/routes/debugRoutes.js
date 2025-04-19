const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

router.get('/debug-supabase', async (req, res) => {
  try {
    const { data, error } = await supabase.from('stores').select('*').limit(1);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Supabase connection OK ✅', sampleStore: data[0] || null });
  } catch (err) {
    res.status(500).json({ error: 'Unexpected server error.' });
  }
});

module.exports = router;
