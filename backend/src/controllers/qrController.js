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
    const { building, department, limit = 40 } = req.query;
    const query = {};
    if (building) query.buildingEnglish = building;
    if (department) query.departmentEnglish = department;

    const items = await Item.find(query).limit(parseInt(limit, 10)).lean();

    const labelsHtml = items
      .map(
        (item) => `
      <div class="tag-card">
        <div class="tag-header">MBMC ASSET TAG</div>
        <div class="tag-code">${item.assetCode}</div>
        <div class="tag-qr">
          <img src="${item.qrCode.dataUrl}" alt="${item.assetCode}" />
        </div>
        <div class="tag-title">${item.nameEnglish}</div>
        <div class="tag-mr">${item.nameMarathi}</div>
        <div class="tag-meta">
          <div><strong>Dept:</strong> ${item.departmentEnglish}</div>
          <div><strong>Floor:</strong> ${item.floorEnglish}</div>
        </div>
      </div>
    `
      )
      .join('\n');

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MBMC Asset Tags Sheet (${items.length} Tags)</title>
  <style>
    @media print {
      body { background: none; margin: 0; padding: 0; }
      .no-print { display: none !important; }
      .sheet-grid { gap: 8px; }
      .tag-card { page-break-inside: avoid; border: 1.5px solid #000 !important; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f8fafc;
      padding: 20px;
      margin: 0;
    }
    .no-print {
      margin-bottom: 20px;
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .print-btn {
      background: #0284c7;
      color: #fff;
      font-weight: 700;
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    .sheet-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
    }
    .tag-card {
      background: #fff;
      border: 1.5px solid #1e293b;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
      box-sizing: border-box;
    }
    .tag-header {
      font-size: 10px;
      font-weight: 800;
      color: #1e3a8a;
      letter-spacing: 0.05em;
    }
    .tag-code {
      display: inline-block;
      background: #0f172a;
      color: #fff;
      font-family: monospace;
      font-size: 13px;
      font-weight: bold;
      padding: 2px 8px;
      border-radius: 4px;
      margin: 4px 0;
    }
    .tag-qr img {
      width: 110px;
      height: 110px;
      display: block;
      margin: 0 auto;
    }
    .tag-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 4px;
    }
    .tag-mr {
      font-size: 11px;
      color: #475569;
    }
    .tag-meta {
      font-size: 9px;
      color: #334155;
      text-align: left;
      margin-top: 6px;
      padding-top: 4px;
      border-top: 1px dashed #cbd5e1;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="print-btn" onclick="window.print()">Print Label Sheet</button>
    <span>Showing <strong>${items.length}</strong> labels ready for printing</span>
  </div>
  <div class="sheet-grid">
    ${labelsHtml}
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(fullHtml);
  } catch (error) {
    next(error);
  }
};
