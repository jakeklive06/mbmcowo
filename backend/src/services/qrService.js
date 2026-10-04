const QRCode = require('qrcode');

/**
 * Generates a Base64 PNG Data URL for a given URL / string
 */
async function generateQrDataUrl(text, options = {}) {
  const defaultOptions = {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    margin: 2,
    width: options.width || 280,
    color: {
      dark: '#1e293b', // Slate 800
      light: '#ffffff',
    },
  };
  return await QRCode.toDataURL(text, { ...defaultOptions, ...options });
}

/**
 * Generates a PNG Buffer for binary image streaming
 */
async function generateQrPngBuffer(text, options = {}) {
  const defaultOptions = {
    errorCorrectionLevel: 'H',
    type: 'png',
    margin: 2,
    width: options.width || 360,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  };
  return await QRCode.toBuffer(text, { ...defaultOptions, ...options });
}

/**
 * Generates an SVG string of the QR code
 */
async function generateQrSvg(text, options = {}) {
  const defaultOptions = {
    errorCorrectionLevel: 'M',
    type: 'svg',
    margin: 2,
    width: options.width || 300,
  };
  return await QRCode.toString(text, { ...defaultOptions, ...options });
}

/**
 * Generates a ready-to-print HTML Asset Tag label
 */
function generatePrintableLabelHtml(item) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Asset Tag - ${item.assetCode}</title>
  <style>
    @media print {
      body { margin: 0; padding: 0; background: none; }
      .no-print { display: none !important; }
      .label-card { box-shadow: none !important; border: 2px solid #000 !important; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #f1f5f9;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 30px 15px;
      margin: 0;
    }
    .print-btn {
      background: #0284c7;
      color: #fff;
      border: none;
      padding: 10px 22px;
      font-size: 15px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      margin-bottom: 24px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.15);
    }
    .print-btn:hover { background: #0369a1; }
    .label-card {
      width: 380px;
      background: #ffffff;
      border: 2px solid #0f172a;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
      box-sizing: border-box;
      text-align: center;
    }
    .corp-title {
      font-size: 12px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      font-weight: 800;
      color: #1e3a8a;
      margin-bottom: 2px;
    }
    .corp-subtitle {
      font-size: 10px;
      color: #64748b;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .badge-code {
      display: inline-block;
      background: #0f172a;
      color: #f8fafc;
      font-family: "Courier New", Courier, monospace;
      font-size: 17px;
      font-weight: 800;
      letter-spacing: 0.08em;
      padding: 5px 14px;
      border-radius: 6px;
      margin-bottom: 12px;
    }
    .qr-container {
      margin: 6px 0;
    }
    .qr-container img {
      width: 170px;
      height: 170px;
      display: block;
      margin: 0 auto;
    }
    .item-name-en {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 8px;
    }
    .item-name-mr {
      font-size: 14px;
      color: #475569;
      margin-top: 2px;
      font-weight: 500;
    }
    .meta-box {
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px dashed #cbd5e1;
      font-size: 11px;
      color: #334155;
      text-align: left;
      line-height: 1.5;
    }
    .meta-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
    .meta-label { font-weight: 600; color: #64748b; }
    .meta-val { font-weight: 600; text-align: right; max-width: 65%; }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="print-btn" onclick="window.print()">Print Asset Label</button>
  </div>
  <div class="label-card">
    <div class="corp-title">Mira Bhayandar Municipal Corp</div>
    <div class="badge-code">${item.assetCode}</div>
    <div style="font-family: monospace; font-size: 13px; font-weight: 800; color: #1e3a8a; margin-bottom: 4px;">
      ${item.unitLabel || 'Unit ' + item.unitNumber} &bull; <span style="color: ${item.status === 'Operational' ? '#059669' : '#dc2626'}">${item.status}</span>
    </div>
    <div class="qr-container">
      <img src="${item.qrCode.dataUrl}" alt="QR Code for ${item.assetCode}">
    </div>
    <div class="item-name-en">${item.nameEnglish}</div>
    <div class="item-name-mr">${item.nameMarathi}</div>
    <div class="meta-box">
      <div class="meta-row">
        <span class="meta-label">Unit Number:</span>
        <span class="meta-val" style="font-family: monospace;">${item.unitLabel || 'Unit ' + item.unitNumber}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Model No:</span>
        <span class="meta-val" style="font-family: monospace;">${item.modelNumber || '-'}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Department:</span>
        <span class="meta-val">${item.departmentEnglish}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Location:</span>
        <span class="meta-val">${item.floorEnglish} &bull; ${item.ward}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Condition:</span>
        <span class="meta-val" style="color: ${item.status === 'Operational' ? '#059669' : '#dc2626'}">${item.conditionSummary || item.status}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Office Lot:</span>
        <span class="meta-val" style="font-family: monospace;">${item.lotCode || 'N/A'}</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

module.exports = {
  generateQrDataUrl,
  generateQrPngBuffer,
  generateQrSvg,
  generatePrintableLabelHtml,
};
