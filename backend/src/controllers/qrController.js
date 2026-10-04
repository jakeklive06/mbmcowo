const Item = require('../models/Item');
const { generateQrPngBuffer, generatePrintableLabelHtml } = require('../services/qrService');

/**
 * Serves dynamic PNG QR Code image for an asset code
 */
exports.getQrImage = async (req, res, next) => {
  try {
    const code = req.params.code.toUpperCase().trim();
    const item = await Item.findOne({ assetCode: code });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const pngBuffer = await generateQrPngBuffer(item.qrCode.scanUrl);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="${code}-qr.png"`);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(pngBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Serves printable HTML label for single asset
 */
exports.getPrintableLabel = async (req, res, next) => {
  try {
    const code = req.params.code.toUpperCase().trim();
    const item = await Item.findOne({ assetCode: code });
    if (!item) {
      return res.status(404).send('Asset not found');
    }

    const html = generatePrintableLabelHtml(item);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (error) {
    next(error);
  }
};

/**
 * Serves a batch printable sticker sheet for physical asset tagging
 */
exports.getBatchLabels = async (req, res, next) => {
  try {
    const { building, department, lotCode, status, limit, skip = 0, all } = req.query;
    const query = {};
    if (building && building !== 'all') query.buildingEnglish = building;
    if (department && department !== 'all') query.departmentEnglish = department;
    if (lotCode && lotCode !== 'all') query.lotCode = lotCode;
    if (status && status !== 'all') query.status = status;

    const totalMatching = await Item.countDocuments(query);

    let limitNum = 0; // 0 in mongoose means no limit -> returns ALL assets
    if (limit === 'all' || all === 'true' || all === '1') {
      limitNum = 0;
    } else if (limit !== undefined && limit !== null && limit !== '') {
      limitNum = parseInt(limit, 10);
      if (isNaN(limitNum)) limitNum = 0;
    }

    const skipNum = parseInt(skip, 10) || 0;

    let itemQuery = Item.find(query).sort({ lotCode: 1, unitNumber: 1 }).skip(skipNum);
    if (limitNum > 0) {
      itemQuery = itemQuery.limit(limitNum);
    }

    const items = await itemQuery.lean();

    const labelsHtml = items
      .map(
        (item) => `
      <div class="tag-card" data-code="${item.assetCode}" data-name="${item.nameEnglish} ${item.nameMarathi}" data-dept="${item.departmentEnglish}">
        <div class="tag-header">MIRA BHAYANDAR MUNICIPAL CORPORATION</div>
        <div class="tag-sub-header">MUNICIPAL PHYSICAL ASSET TAG</div>
        <div class="tag-code-row">
          <span class="tag-code">${item.assetCode}</span>
          <span class="tag-unit">${item.unitLabel || 'Unit ' + item.unitNumber}</span>
        </div>
        <div class="tag-status-row">
          <span class="status-badge ${item.status === 'Operational' ? 'status-usable' : 'status-damaged'}">
            ${item.status === 'Operational' ? '● OPERATIONAL (FINE)' : '▲ DAMAGED (BROKEN)'}
          </span>
        </div>
        <div class="tag-qr">
          <img src="${item.qrCode.dataUrl}" alt="${item.assetCode}" loading="lazy" />
        </div>
        <div class="tag-title">${item.nameEnglish}</div>
        <div class="tag-mr">${item.nameMarathi}</div>
        <div class="tag-meta">
          <div class="meta-row"><strong>Dept:</strong> <span>${item.departmentEnglish}</span></div>
          <div class="meta-row"><strong>Loc:</strong> <span>${item.floorEnglish} &bull; ${item.buildingEnglish}</span></div>
          <div class="meta-row"><strong>Lot:</strong> <span>${item.lotCode || 'N/A'} (Model: ${item.modelNumber || 'N/A'})</span></div>
        </div>
      </div>
    `
      )
      .join('\n');

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MBMC Official Asset Tags (${items.length} of ${totalMatching} Assets)</title>
  <style>
    :root {
      --primary: #0284c7;
      --navy: #0f172a;
      --usable: #059669;
      --damaged: #dc2626;
      --border-color: #334155;
      --columns: 3;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .top-toolbar {
      position: sticky;
      top: 0;
      z-index: 9999;
      background: #0f172a;
      color: #fff;
      padding: 12px 24px;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    }
    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .emblem {
      background: #38bdf8;
      color: #0f172a;
      font-weight: 900;
      font-size: 14px;
      padding: 6px 12px;
      border-radius: 6px;
      letter-spacing: 1px;
    }
    .toolbar-title {
      font-size: 16px;
      font-weight: 700;
    }
    .toolbar-subtitle {
      font-size: 12px;
      color: #94a3b8;
    }
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .btn-print {
      background: #38bdf8;
      color: #0f172a;
      font-weight: 800;
      font-size: 14px;
      padding: 9px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.15s;
    }
    .btn-print:hover { background: #7dd3fc; }
    .layout-toggle {
      background: #1e293b;
      border: 1px solid #334155;
      color: #e2e8f0;
      font-size: 12px;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
    }
    .search-box {
      background: #1e293b;
      border: 1px solid #334155;
      color: #fff;
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 13px;
      width: 220px;
    }
    .search-box::placeholder { color: #64748b; }
    
    .sheet-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }
    .sheet-grid {
      display: grid;
      grid-template-columns: repeat(var(--columns), 1fr);
      gap: 14px;
    }

    .tag-card {
      background: #ffffff;
      border: 1.5px solid #0f172a;
      border-radius: 8px;
      padding: 10px 12px;
      text-align: center;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 310px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .tag-header {
      font-size: 8.5px;
      font-weight: 900;
      color: #1e3a8a;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .tag-sub-header {
      font-size: 7.5px;
      font-weight: 700;
      color: #475569;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
    }
    .tag-code-row {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .tag-code {
      display: inline-block;
      background: #0f172a;
      color: #fff;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 13px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }
    .tag-unit {
      background: #e2e8f0;
      color: #1e293b;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      font-family: monospace;
    }
    .tag-status-row {
      margin-bottom: 6px;
    }
    .status-badge {
      display: inline-block;
      font-size: 9.5px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 0.4px;
    }
    .status-usable {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .status-damaged {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    .tag-qr {
      margin: 4px auto;
      background: #ffffff;
      padding: 4px;
      display: inline-block;
    }
    .tag-qr img {
      width: 105px;
      height: 105px;
      display: block;
      margin: 0 auto;
      image-rendering: pixelated;
    }
    .tag-title {
      font-size: 12.5px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.25;
      margin-top: 4px;
    }
    .tag-mr {
      font-size: 11px;
      font-weight: 600;
      color: #334155;
      margin-top: 2px;
      line-height: 1.2;
    }
    .tag-meta {
      font-size: 8.5px;
      color: #1e293b;
      text-align: left;
      margin-top: 6px;
      padding-top: 5px;
      border-top: 1px dashed #94a3b8;
      line-height: 1.35;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      gap: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .meta-row span {
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: right;
    }

    @media print {
      @page {
        size: A4 portrait;
        margin: 8mm;
      }
      body {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .sheet-container {
        padding: 0 !important;
        max-width: none !important;
        width: 100% !important;
      }
      .sheet-grid {
        grid-template-columns: repeat(3, 1fr) !important;
        gap: 6mm !important;
      }
      .tag-card {
        border: 1.5px solid #000000 !important;
        box-shadow: none !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        margin-bottom: 0 !important;
      }
      .tag-code {
        background: #000000 !important;
        color: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
      }
      .status-badge {
        border: 1px solid #000000 !important;
        -webkit-print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <div class="top-toolbar no-print">
    <div class="toolbar-left">
      <div class="emblem">MBMC</div>
      <div>
        <div class="toolbar-title">MBMC Asset Tag Print Studio</div>
        <div class="toolbar-subtitle">
          Ready to print <strong>${items.length}</strong> of <strong>${totalMatching}</strong> physical asset tags
          ${req.query.status ? ` &bull; Condition: <strong>${req.query.status}</strong>` : ''}
          ${req.query.building ? ` &bull; Building: <strong>${req.query.building}</strong>` : ''}
        </div>
      </div>
    </div>
    <div class="toolbar-actions">
      <input type="text" id="filterInput" class="search-box" placeholder="Filter tags on sheet..." oninput="filterCards(this.value)" />
      <select class="layout-toggle" onchange="changeColumns(this.value)">
        <option value="3" selected>3 Columns (Standard Sheet)</option>
        <option value="4">4 Columns (High Density)</option>
        <option value="2">2 Columns (Large Tags)</option>
      </select>
      <button class="btn-print" onclick="window.print()">
        <span>🖨️ Print ${items.length} Tags Now</span>
      </button>
    </div>
  </div>

  <div class="sheet-container">
    <div class="sheet-grid" id="sheetGrid">
      ${labelsHtml}
    </div>
  </div>

  <script>
    function changeColumns(cols) {
      document.documentElement.style.setProperty('--columns', cols);
    }
    function filterCards(term) {
      const q = term.toLowerCase().trim();
      const cards = document.querySelectorAll('.tag-card');
      let visible = 0;
      cards.forEach(card => {
        const text = (card.getAttribute('data-code') + ' ' + card.getAttribute('data-name') + ' ' + card.getAttribute('data-dept')).toLowerCase();
        if (!q || text.includes(q)) {
          card.style.display = 'flex';
          visible++;
        } else {
          card.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(fullHtml);
  } catch (error) {
    next(error);
  }
};
