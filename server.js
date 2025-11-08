// server.js (CommonJS)
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('./')); // serves index.html from repo root

// Proxy: Trains between stations (IndianRailAPI)
app.get('/api/trains-between', async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({ error: 'from/to required' });

    const url =
      `http://indianrailapi.com/api/v2/TrainBetweenStation/` +
      `apikey/${process.env.INDIAN_RAIL_API_KEY}/From/${from}/To/${to}`;

    const r = await fetch(url);
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Upstream error', details: String(e) });
  }
});

app.listen(PORT, () => console.log(`Server running http://localhost:${PORT}`));
