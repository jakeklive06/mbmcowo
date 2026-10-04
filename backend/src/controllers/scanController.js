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

    // Look up by assetCode, modelNumber, lotCode, or prefix
    let item = await Item.findOne({
      $or: [
        { assetCode: code },
        { modelNumber: code },
        { lotCode: code },
        { assetCode: { $regex: `^${rawCode}$`, $options: 'i' } },
        { modelNumber: { $regex: `^${rawCode}$`, $options: 'i' } },
      ],
    });

    if (!item) {
      item = await Item.findOne({
        $or: [
          { assetCode: { $regex: `^${rawCode}-`, $options: 'i' } },
          { modelNumber: { $regex: `^${rawCode}-`, $options: 'i' } },
          { lotCode: { $regex: rawCode, $options: 'i' } },
        ],
      }).sort({ unitNumber: 1 });
    }

    // Fetch sibling units in the same office lot if available
    const siblingUnits = item && item.lotCode
      ? await Item.find({ lotCode: item.lotCode }).sort({ unitNumber: 1 }).lean()
      : (item ? [item.toObject ? item.toObject() : item] : []);

    // If client asks for JSON (e.g. API client, mobile app scanner)
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      if (!item) return res.status(404).json({ success: false, message: `Asset not found for query: ${rawCode}` });
      const itemData = item.toObject ? item.toObject() : { ...item };
      itemData.siblingUnits = siblingUnits;
      return res.json({ success: true, data: itemData });
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
    const isDamaged = item.status === 'Damaged' || item.status === 'Partially Damaged';
    const statusBg = isDamaged ? '#ef4444' : '#10b981';
    const statusText = '#ffffff';

    const lotTotal = item.lotTotalQty || siblingUnits.length || 1;
    const lotFine = item.lotUsableQty !== undefined
      ? item.lotUsableQty
      : siblingUnits.filter((s) => s.status === 'Operational').length;
    const lotBroken = item.lotDamagedQty !== undefined
      ? item.lotDamagedQty
      : siblingUnits.filter((s) => s.status === 'Damaged' || s.status === 'Partially Damaged').length;

    // Render HTML
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${item.assetCode} (${item.unitLabel || 'Unit ' + item.unitNumber}) | ${item.nameEnglish} - MBMC Asset Verification</title>
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
      max-width: 520px;
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
    .unit-badge {
      font-family: monospace;
      font-size: 13px;
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
      font-size: 12px;
      font-weight: 800;
      padding: 6px 12px;
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
    .condition-alert {
      background: ${isDamaged ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'};
      border: 1px solid ${isDamaged ? '#ef4444' : '#10b981'};
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 16px;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .condition-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: ${isDamaged ? '#ef4444' : '#10b981'};
      flex-shrink: 0;
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
    
    /* Office Siblings Inventory Grid */
    .office-section {
      margin-top: 20px;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 14px;
    }
    .office-title {
      font-size: 13px;
      font-weight: 700;
      color: #38bdf8;
      margin-bottom: 4px;
    }
    .office-counts {
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 12px;
    }
    .siblings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 8px;
      margin-bottom: 12px;
    }
    .sibling-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 8px 10px;
      text-decoration: none;
      color: #fff;
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 12px;
      transition: all 0.2s;
    }
    .sibling-card:hover {
      border-color: #38bdf8;
      transform: translateY(-2px);
    }
    .sibling-card.active-unit {
      border: 2px solid #38bdf8;
      background: #1e3a5f;
    }
    .sibling-status {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
    }
    .status-fine { color: #34d399; }
    .status-broken { color: #f87171; }
    
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
        <span class="code-badge">${item.assetCode}</span>
        <span class="unit-badge">${item.unitLabel || 'Unit ' + item.unitNumber}</span>
        <span class="status-pill">${item.status}</span>
      </div>

      <h1 class="item-title-en">${item.nameEnglish}</h1>
      <div class="item-title-mr">${item.nameMarathi}</div>
      <span class="category-badge">${item.category}</span>

      <div class="condition-alert">
        <div class="condition-dot"></div>
        <div>
          <strong>${item.conditionSummary}</strong><br>
          <span style="font-size: 11px; color: var(--text-muted);">Unique QR Code tag for this physical item unit</span>
        </div>
      </div>

      <div class="info-list">
        <div class="info-row">
          <span class="info-label">Unit Number</span>
          <span class="info-value" style="color: #facc15; font-family: monospace;">${item.unitLabel || 'Unit ' + item.unitNumber}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Asset Code</span>
          <span class="info-value" style="color: #38bdf8; font-family: monospace;">${item.assetCode}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Model Number</span>
          <span class="info-value" style="font-family: monospace;">${item.modelNumber || '-'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Department</span>
          <span class="info-value">${item.departmentEnglish}</span>
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
          <span class="info-label">Office Lot Code</span>
          <span class="info-value" style="font-family: monospace;">${item.lotCode || 'N/A'}</span>
        </div>
      </div>

      <div class="qr-preview">
        <img src="${item.qrCode.dataUrl}" alt="QR code" />
        <div class="qr-caption">Unique QR Code for ${item.assetCode} (${item.unitLabel || 'Unit ' + item.unitNumber})</div>
      </div>

      <a href="/api/qr/${item.assetCode}/label" target="_blank" class="action-btn">
        Print Physical QR Label for this Item
      </a>

      <!-- Office Inventory with Sibling Units -->
      <div class="office-section">
        <div class="office-title">Office Inventory (${item.departmentEnglish})</div>
        <div class="office-counts">
          Total items in this office lot: <strong>${lotTotal}</strong> &bull;
          <span style="color: #34d399; font-weight: 700;">${lotFine} Fine (Operational)</span>,
          <span style="color: #f87171; font-weight: 700;">${lotBroken} Broken (Damaged)</span>
        </div>

        <div class="siblings-grid">
          ${siblingUnits.map((sub) => {
            const isSubDamaged = sub.status === 'Damaged' || sub.status === 'Partially Damaged';
            const isActive = sub.assetCode === item.assetCode;
            return `
              <a href="/scan/${sub.assetCode}" class="sibling-card ${isActive ? 'active-unit' : ''}">
                <div style="font-weight: 700;">${sub.unitLabel || 'Unit ' + sub.unitNumber} ${isActive ? '&bull; Current' : ''}</div>
                <div style="font-family: monospace; font-size: 10px; color: #94a3b8;">${sub.assetCode}</div>
                <div class="sibling-status ${isSubDamaged ? 'status-broken' : 'status-fine'}">
                  ${isSubDamaged ? 'Broken' : 'Fine'}
                </div>
              </a>
            `;
          }).join('')}
        </div>

        ${item.lotCode ? `
          <a href="/api/qr/batch-labels?lotCode=${item.lotCode}" target="_blank" class="action-btn btn-secondary" style="font-size: 12px; padding: 8px;">
            Print All ${siblingUnits.length} Labels for this Office
          </a>
        ` : ''}
      </div>

      <!-- Quick Issue Report Form -->
      <div class="report-card">
        <h3>Report Item Condition / Maintenance</h3>
        <form method="POST" action="/scan/${item.assetCode}/report">
          <select name="status" class="input-field">
            <option value="Operational" ${item.status === 'Operational' ? 'selected' : ''}>Operational (Fine / Good condition)</option>
            <option value="Damaged" ${item.status === 'Damaged' ? 'selected' : ''}>Damaged (Broken / Needs repair)</option>
            <option value="Under Repair" ${item.status === 'Under Repair' ? 'selected' : ''}>Under Repair</option>
          </select>
          <input type="text" name="notes" placeholder="Condition details or inspection notes..." class="input-field" />
          <input type="text" name="reportedBy" placeholder="Officer / Inspector Name" class="input-field" />
          <button type="submit" class="action-btn btn-secondary">Submit Condition Update</button>
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

    if (status) {
      item.status = status;
      if (status === 'Operational') {
        item.usableQty = 1;
        item.damagedQty = 0;
        item.conditionSummary = 'Operational / Fine (Good condition)';
      } else if (status === 'Damaged') {
        item.usableQty = 0;
        item.damagedQty = 1;
        item.conditionSummary = 'Damaged / Broken (Requires maintenance/repair)';
      } else {
        item.conditionSummary = status;
      }
    }

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

    // Sync sibling lot counts
    if (item.lotCode) {
      const lotUsable = await Item.countDocuments({ lotCode: item.lotCode, status: 'Operational' });
      const lotDamaged = await Item.countDocuments({ lotCode: item.lotCode, status: { $ne: 'Operational' } });
      await Item.updateMany({ lotCode: item.lotCode }, { lotUsableQty: lotUsable, lotDamagedQty: lotDamaged });
    }

    // Redirect back to scan view
    res.redirect(`/scan/${item.assetCode}`);
  } catch (error) {
    next(error);
  }
};
