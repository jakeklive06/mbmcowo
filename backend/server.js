require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

// Route imports
const itemRoutes = require('./src/routes/itemRoutes');
const qrRoutes = require('./src/routes/qrRoutes');
const scanRoutes = require('./src/routes/scanRoutes');
const statsRoutes = require('./src/routes/statsRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'MBMC Asset QR Code Management API',
  });
});

// Root API overview page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>MBMC Asset QR Management API</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px 20px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
        h1 { color: #38bdf8; border-bottom: 2px solid #334155; padding-bottom: 12px; }
        .tag { background: #1e293b; padding: 4px 10px; border-radius: 6px; font-family: monospace; color: #34d399; }
        a { color: #60a5fa; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .card { background: #1e293b; border-radius: 10px; padding: 18px; margin: 16px 0; border: 1px solid #334155; }
        ul { list-style: none; padding: 0; }
        li { margin: 8px 0; }
      </style>
    </head>
    <body>
      <h1>Mira Bhayandar Municipal Corporation (MBMC)</h1>
      <h2>Asset QR Code Management Backend API</h2>
      <p>Backend service operational. Use the following endpoints:</p>
      
      <div class="card">
        <h3>Core REST Endpoints</h3>
        <ul>
          <li><a href="/api/items">GET /api/items</a> - Query & filter items (search, building, department, status)</li>
          <li><a href="/api/items/code/MBMC-AST-0001">GET /api/items/code/:code</a> - Retrieve asset details by QR asset code</li>
          <li><a href="/api/stats/overview">GET /api/stats/overview</a> - Municipal asset analytics and health summary</li>
          <li><a href="/api/items/departments">GET /api/items/departments</a> - Distinct departments with counts</li>
          <li><a href="/api/items/buildings">GET /api/items/buildings</a> - Distinct buildings & wards with counts</li>
        </ul>
      </div>

      <div class="card">
        <h3>QR Code & Scanner Services</h3>
        <ul>
          <li><a href="/lookup" target="_blank">GET /lookup</a> - <strong>Model Number & Asset Code Search Portal (Type & Find)</strong></li>
          <li><a href="/scan/MBMC-MOD-0001" target="_blank">GET /scan/:modelNumber</a> - Look up item by Model Number (e.g. MBMC-MOD-0001)</li>
          <li><a href="/scan/MBMC-AST-0001" target="_blank">GET /scan/:assetCode</a> - Look up item by QR Asset Code (e.g. MBMC-AST-0001)</li>
          <li><a href="/api/items/model/MBMC-MOD-0001" target="_blank">GET /api/items/model/:modelNumber</a> - JSON API by Model Number</li>
          <li><a href="/api/items/lookup/MBMC-MOD-0001" target="_blank">GET /api/items/lookup/:query</a> - Universal JSON lookup (Model or Asset Code)</li>
          <li><a href="/api/qr/MBMC-AST-0001/image" target="_blank">GET /api/qr/:code/image</a> - Direct PNG QR code image</li>
          <li><a href="/api/qr/MBMC-AST-0001/label" target="_blank">GET /api/qr/:code/label</a> - Printable asset tag label</li>
          <li><a href="/api/qr/batch-labels?limit=24" target="_blank">GET /api/qr/batch-labels</a> - Batch sticker sheet for printing</li>
        </ul>
      </div>
    </body>
    </html>
  `);
});

// API Routes
app.use('/api/items', itemRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/stats', statsRoutes);
app.use('/scan', scanRoutes);
app.use('/lookup', scanRoutes);

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`[Server] MBMC Asset Backend running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`[Server] Access API at: http://localhost:${PORT}`);
      console.log(`[Server] Test sample scan page at: http://localhost:${PORT}/scan/MBMC-AST-0001`);
    });
  });
}

module.exports = app;
