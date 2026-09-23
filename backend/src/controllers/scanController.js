const Item = require('../models/Item');

/**
 * Render dedicated Model Number & Asset Code Lookup Search Portal
 */
exports.renderLookupPortal = async (req, res, next) => {
  try {
    const totalAssets = await Item.countDocuments();
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MBMC Asset Lookup - Search by Model or Asset Code</title>
  <style>
    :root {
      --primary: #2563eb;
      --bg: #0f172a;
      --card-bg: #1e293b;
      --card-border: #334155;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: var(--bg);
      color: var(--text-main);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .container {
      width: 100%;
      max-width: 520px;
      margin: 0 auto;
    }
    .portal-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      padding: 32px 24px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.5);
      text-align: center;
    }
    .gov-badge {
      font-size: 12px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #38bdf8;
      font-weight: 800;
      margin-bottom: 8px;
    }
    h1 {
      font-size: 24px;
      margin: 0 0 8px 0;
      color: #fff;
    }
    p {
      color: var(--text-muted);
      font-size: 14px;
      margin: 0 0 24px 0;
      line-height: 1.5;
    }
    .search-box {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
    }
    .search-input {
      flex: 1;
      background: #0f172a;
      border: 2px solid #3b82f6;
      border-radius: 10px;
      color: #fff;
      padding: 14px 16px;
      font-size: 16px;
      font-family: monospace;
      outline: none;
      transition: border-color 0.2s;
    }
    .search-input:focus {
      border-color: #60a5fa;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
    }
    .search-btn {
      background: #2563eb;
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 0 22px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }
    .search-btn:hover { background: #1d4ed8; }
    .examples-box {
      text-align: left;
      background: #0f172a;
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 16px;
      margin-top: 20px;
    }
    .examples-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 10px;
    }
    .pill-group {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .sample-pill {
      background: #1e293b;
      color: #38bdf8;
      border: 1px solid #475569;
      border-radius: 6px;
      padding: 6px 12px;
      font-family: monospace;
      font-size: 12px;
      text-decoration: none;
      transition: all 0.2s;
    }
    .sample-pill:hover {
      background: #334155;
      border-color: #38bdf8;
    }
    .stats-footer {
      margin-top: 20px;
      font-size: 12px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="portal-card">
      <div class="gov-badge">Mira Bhayandar Municipal Corp</div>
      <h1>Asset & Model Search</h1>
      <p>Enter any <strong>Model Number</strong> or <strong>Asset Code</strong> to immediately retrieve item specifications, condition, and location.</p>
      
      <form class="search-box" onsubmit="event.preventDefault(); const q = document.getElementById('modelInput').value.trim(); if(q) window.location.href='/scan/' + encodeURIComponent(q);">
        <input type="text" id="modelInput" class="search-input" placeholder="e.g. MBMC-MOD-0001 or MBMC-AST-0001" autofocus required />
        <button type="submit" class="search-btn">Search</button>
      </form>

      <div class="examples-box">
        <div class="examples-title">Click Quick Samples to Test:</div>
        <div class="pill-group">
          <a href="/scan/MBMC-MOD-0001" class="sample-pill">MBMC-MOD-0001 (Model)</a>
          <a href="/scan/MBMC-MOD-0010" class="sample-pill">MBMC-MOD-0010 (Model)</a>
          <a href="/scan/MBMC-AST-0001" class="sample-pill">MBMC-AST-0001 (QR Code)</a>
          <a href="/scan/MBMC-MOD-0050" class="sample-pill">MBMC-MOD-0050 (Model)</a>
          <a href="/scan/MBMC-MOD-0100" class="sample-pill">MBMC-MOD-0100 (Model)</a>
        </div>
      </div>

      <div class="stats-footer">
        <strong>${totalAssets}</strong> registered municipal assets indexed and searchable.
      </div>
    </div>
  </div>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (error) {
    next(error);
  }
};

/**
 * Mobile-friendly QR code & Model Number scan/lookup view
 * Displays full item information in English & Marathi with verification actions
 */
exports.renderScanView = async (req, res, next) => {
  try {
    const rawCode = req.params.code ? req.params.code.trim() : '';
    if (!rawCode) {
      return exports.renderLookupPortal(req, res, next);
    }

    const code = rawCode.toUpperCase();

    // Look up by assetCode OR modelNumber
    const item = await Item.findOne({
      $or: [
        { assetCode: code },
        { modelNumber: code },
        { assetCode: { $regex: `^${rawCode}$`, $options: 'i' } },
        { modelNumber: { $regex: `^${rawCode}$`, $options: 'i' } },
      ],
    });

    // If client asks for JSON (e.g. API client, mobile app scanner)
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      if (!item) return res.status(404).json({ success: false, message: `Asset not found for query: ${rawCode}` });
      return res.json({ success: true, data: item });
    }

    if (!item) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Asset Not Found - MBMC</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; text-align: center; }
            .card { background: #1e293b; padding: 32px; border-radius: 16px; max-width: 420px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            h1 { color: #f43f5e; font-size: 24px; margin-top: 0; }
            p { color: #94a3b8; font-size: 15px; }
            .code-pill { background: #334155; padding: 6px 14px; border-radius: 8px; font-family: monospace; font-size: 16px; color: #fca5a5; }
            .btn-back { display: inline-block; margin-top: 18px; background: #2563eb; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Asset / Model Not Found</h1>
            <p>No item found matching Model Number or Asset Code: <br><br><span class="code-pill">${rawCode}</span></p>
            <a href="/lookup" class="btn-back">Try Another Search</a>
          </div>
        </body>
        </html>
      `);
    }

    // Status styling
    let statusBg = '#10b981'; // Green
    let statusText = '#ffffff';
    if (item.status === 'Partially Damaged') {
      statusBg = '#f59e0b';
    } else if (item.status === 'Damaged') {
      statusBg = '#ef4444';
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${item.assetCode} | ${item.nameEnglish} - MBMC Asset Verification</title>
  <style>
    :root {
      --primary: #2563eb;
      --bg: #0f172a;
      --card-bg: #1e293b;
      --card-border: #334155;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text-main);
      display: flex;
      justify-content: center;
      min-height: 100vh;
    }
    .container {
      width: 100%;
      max-width: 480px;
      margin: 0 auto;
    }
    .header-bar {
      text-align: center;
      margin-bottom: 12px;
      padding: 12px;
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(8px);
      border-radius: 12px;
      border: 1px solid var(--card-border);
    }
    .header-title {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #60a5fa;
      text-transform: uppercase;
    }
    .header-sub {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 2px;
    }
    .search-nav {
      display: flex;
      gap: 6px;
      margin-bottom: 14px;
    }
    .search-nav-input {
      flex: 1;
      background: #1e293b;
      border: 1px solid #475569;
      color: #fff;
      padding: 9px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-family: monospace;
      outline: none;
    }
    .search-nav-input:focus { border-color: #38bdf8; }
    .search-nav-btn {
      background: #2563eb;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 0 14px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .asset-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 22px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
    }
    .identifiers-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .code-badge {
      font-family: monospace;
      font-size: 14px;
      font-weight: 800;
      color: #38bdf8;
      background: #0f172a;
      padding: 5px 10px;
      border-radius: 6px;
      border: 1px solid #334155;
    }
    .model-badge {
      font-family: monospace;
      font-size: 14px;
      font-weight: 800;
      color: #facc15;
      background: #0f172a;
      padding: 5px 10px;
      border-radius: 6px;
      border: 1px solid #334155;
    }
    .status-pill {
      background: ${statusBg};
      color: ${statusText};
      font-size: 11px;
      font-weight: 700;
      padding: 5px 10px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .item-title-en {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 4px 0;
    }
    .item-title-mr {
      font-size: 16px;
      color: #93c5fd;
      margin: 0 0 10px 0;
    }
    .category-badge {
      display: inline-block;
      font-size: 11px;
      background: #334155;
      color: #cbd5e1;
      padding: 3px 8px;
      border-radius: 4px;
      margin-bottom: 14px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      margin: 14px 0;
    }
    .stat-box {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
    }
    .stat-number {
      font-size: 20px;
      font-weight: 800;
    }
    .stat-usable { color: #34d399; }
    .stat-damaged { color: #f87171; }
    .stat-total { color: #60a5fa; }
    .stat-label {
      font-size: 10px;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-top: 2px;
    }
    .info-list {
      margin-top: 16px;
      border-top: 1px solid #334155;
      padding-top: 12px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 7px 0;
      border-bottom: 1px solid rgba(51, 65, 85, 0.4);
      font-size: 13px;
    }
    .info-label {
      color: var(--text-muted);
      font-weight: 500;
    }
    .info-value {
      font-weight: 600;
      text-align: right;
      color: #e2e8f0;
      max-width: 60%;
    }
    .qr-preview {
      text-align: center;
      margin: 18px 0 10px 0;
      padding: 12px;
      background: #0f172a;
      border-radius: 12px;
      border: 1px solid #334155;
    }
    .qr-preview img {
      width: 140px;
      height: 140px;
      border-radius: 8px;
      background: #fff;
      padding: 6px;
    }
    .qr-caption {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 6px;
    }
    .action-btn {
      display: block;
      width: 100%;
      background: #2563eb;
      color: #ffffff;
      text-align: center;
      padding: 11px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      border: none;
      cursor: pointer;
      margin-top: 10px;
    }
    .action-btn:hover { background: #1d4ed8; }
    .report-card {
      margin-top: 14px;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 14px;
    }
    .report-card h3 {
      font-size: 13px;
      margin: 0 0 10px 0;
      color: #f8fafc;
    }
    .input-field {
      width: 100%;
      background: #1e293b;
      border: 1px solid #475569;
      color: #fff;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 10px;
      font-size: 13px;
    }
    .btn-secondary {
      background: #475569;
    }
    .btn-secondary:hover { background: #334155; }
    .audit-box {
      margin-top: 14px;
      font-size: 11px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-bar">
      <div class="header-title">Mira Bhayandar Municipal Corporation</div>
      <div class="header-sub">Asset QR Code & Model Verification Portal</div>
    </div>

    <!-- Quick Model / Asset Search Bar -->
    <form class="search-nav" onsubmit="event.preventDefault(); const val = document.getElementById('quickSearch').value.trim(); if(val) window.location.href='/scan/' + encodeURIComponent(val);">
      <input type="text" id="quickSearch" class="search-nav-input" placeholder="Type Model No or Asset Code..." />
      <button type="submit" class="search-nav-btn">Search</button>
    </form>

    <div class="asset-card">
      <div class="identifiers-row">
        <span class="code-badge">Asset: ${item.assetCode}</span>
        <span class="model-badge">Model: ${item.modelNumber || 'N/A'}</span>
        <span class="status-pill">${item.status}</span>
      </div>

      <h1 class="item-title-en">${item.nameEnglish}</h1>
      <div class="item-title-mr">${item.nameMarathi}</div>
      <span class="category-badge">${item.category}</span>

      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-number stat-usable">${item.usableQty}</div>
          <div class="stat-label">Usable</div>
        </div>
        <div class="stat-box">
          <div class="stat-number stat-damaged">${item.damagedQty}</div>
          <div class="stat-label">Damaged</div>
        </div>
        <div class="stat-box">
          <div class="stat-number stat-total">${item.totalQty}</div>
          <div class="stat-label">Total</div>
        </div>
      </div>

      <div class="info-list">
        <div class="info-row">
          <span class="info-label">Model Number</span>
          <span class="info-value" style="color: #facc15; font-family: monospace;">${item.modelNumber || '-'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Asset Code</span>
          <span class="info-value" style="color: #38bdf8; font-family: monospace;">${item.assetCode}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Department</span>
          <span class="info-value">${item.departmentEnglish}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Dept (Marathi)</span>
          <span class="info-value">${item.departmentMarathi}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Floor</span>
          <span class="info-value">${item.floorEnglish} (${item.floorMarathi || '-'})</span>
        </div>
        <div class="info-row">
          <span class="info-label">Building / Ward</span>
          <span class="info-value">${item.buildingEnglish} &bull; ${item.ward}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Full Location</span>
          <span class="info-value">${item.fullLocationEnglish}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Source Document</span>
          <span class="info-value">${item.sourceFile}</span>
        </div>
      </div>

      <div class="qr-preview">
        <img src="${item.qrCode.dataUrl}" alt="QR code" />
        <div class="qr-caption">Scan with phone camera or search by Model Number</div>
      </div>

      <a href="/api/qr/${item.assetCode}/label" target="_blank" class="action-btn">
        Print Physical Asset Tag Label
      </a>

      <!-- Quick Issue Report Form -->
      <div class="report-card">
        <h3>Report Asset Condition / Maintenance</h3>
        <form method="POST" action="/scan/${item.assetCode}/report">
          <select name="status" class="input-field">
            <option value="Operational" ${item.status === 'Operational' ? 'selected' : ''}>Operational (Good condition)</option>
            <option value="Partially Damaged" ${item.status === 'Partially Damaged' ? 'selected' : ''}>Partially Damaged (Needs repair)</option>
            <option value="Damaged" ${item.status === 'Damaged' ? 'selected' : ''}>Damaged (Unusable)</option>
            <option value="Under Repair" ${item.status === 'Under Repair' ? 'selected' : ''}>Under Repair</option>
          </select>
          <input type="text" name="notes" placeholder="Condition details or notes..." class="input-field" />
          <input type="text" name="reportedBy" placeholder="Officer / Inspector Name" class="input-field" />
          <button type="submit" class="action-btn btn-secondary">Submit Audit Update</button>
        </form>
      </div>

      <div class="audit-box">
        Last audited: ${new Date(item.lastAuditedAt).toLocaleString()} &bull; Audits logged: ${item.auditHistory.length}
      </div>
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle form submission from the scan view for condition reporting
 */
exports.reportScanIssue = async (req, res, next) => {
  try {
    const rawCode = req.params.code ? req.params.code.trim() : '';
    const code = rawCode.toUpperCase();

    const item = await Item.findOne({
      $or: [{ assetCode: code }, { modelNumber: code }],
    });

    if (!item) {
      return res.status(404).send('Item not found');
    }

    const { status, notes, reportedBy } = req.body;

    if (status) item.status = status;
    item.auditHistory.push({
      action: 'Condition Check',
      status: status || item.status,
      usableQty: item.usableQty,
      damagedQty: item.damagedQty,
      notes: notes || 'Updated via mobile QR/Model lookup view',
      reportedBy: reportedBy || 'Field Officer / Inspector',
      timestamp: new Date(),
    });

    item.lastAuditedAt = new Date();
    await item.save();

    // Redirect back to scan view
    res.redirect(`/scan/${item.assetCode}`);
  } catch (error) {
    next(error);
  }
};
