// server.js
// Hii ndiyo faili kuu ya server yetu ya Node.js.
// This is the main entry point of our Node.js backend server.

require('dotenv').config();
// Inasoma faili ya .env — siri za Supabase zinapatikana.
// Loads .env file — makes Supabase secrets available.

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
// Inaileta Express (server), CORS (ruhusa), na Supabase (database).
// Imports Express (server), CORS (permissions), Supabase (database).

// ── ANZISHA APP NA SUPABASE ───────────────────────────
// Initialize Express app and Supabase client.
const app = express();
const PORT = process.env.PORT || 3000;

// Unganisha na Supabase kwa kutumia siri kutoka .env
// Connect to Supabase using secrets from .env file.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ── MIDDLEWARE ────────────────────────────────────────
app.use(cors());
// Inaruhusu Flutter app kuongea na server hii.
// Allows Flutter app to communicate with this server.

app.use(express.json());
// Inafanya server ielewe data ya JSON.
// Enables the server to parse JSON request bodies.

// ── ROUTE YA KWANZA — ANGALIA KAMA SERVER INAFANYA KAZI
// Health check route — confirms server is running.
app.get('/', (req, res) => {
  res.json({ 
    message: 'Campus Nearby Server inafanya kazi!',
    status: 'ok'
  });
});

// ── ROUTE MUHIMU — PATA BIASHARA ZILIZO KARIBU ───────
// Main route — returns businesses near user's GPS location.
// Inapata biashara zilizo karibu na mwanafunzi.
app.get('/api/businesses/nearby', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    // lat = latitude ya mwanafunzi
    // lng = longitude ya mwanafunzi  
    // radius = umbali wa kutafuta (mita) — default 300

    // Hakikisha lat na lng zimetumwa
    // Validate that lat and lng were provided.
    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Tafadhali tuma lat na lng. Mfano: ?lat=-3.412&lng=36.708'
      });
    }

    const searchRadius = parseFloat(radius) || 300;
    // Radius ya default ni mita 300 — inaweza kubadilishwa
    // Default search radius is 300 meters — can be changed.

    // Uliza Supabase kwa biashara zilizo karibu
    // Query Supabase for nearby businesses using PostGIS.
    const { data, error } = await supabase.rpc('get_nearby_businesses', {
      user_lat: parseFloat(lat),
      user_lng: parseFloat(lng),
      search_radius: searchRadius
    });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Rudisha orodha ya biashara zilizo karibu
    // Return the list of nearby businesses.
    res.json({
      count: data.length,
      businesses: data
    });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Tatizo la server — jaribu tena' });
  }
});

// ── ROUTE — PATA BIASHARA MOJA KWA ID ────────────────
// Get single business details by ID.
// Inapata maelezo kamili ya biashara moja.
app.get('/api/businesses/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Biashara haijapatikana' });
    }

    res.json({ business: data });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Tatizo la server — jaribu tena' });
  }
});

// ── ROUTE — ORODHA YA BIASHARA ZOTE ──────────────────
// Get all businesses — for admin/testing purposes.
// Orodha ya biashara zote — kwa majaribio.
app.get('/api/businesses', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ count: data.length, businesses: data });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Tatizo la server — jaribu tena' });
  }
});

// ── ANZISHA SERVER ────────────────────────────────────
// Start the server and listen for incoming requests.
app.listen(PORT, () => {
  console.log(`Campus Nearby Server inaendesha kwenye port ${PORT}`);
  console.log(`Jaribu: http://localhost:${PORT}`);
}); 
