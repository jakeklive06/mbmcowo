const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Item = require('../src/models/Item');

async function verifyAllQrUnique() {
  console.log('====================================================');
  console.log('      RIGOROUS QR CODE UNIQUENESS VERIFICATION      ');
  console.log('====================================================\n');

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mbmc_assets';
  await mongoose.connect(uri);

  const items = await Item.find({}).lean();
  console.log(`Fetched ${items.length} total physical asset records from MongoDB.`);

  const scanUrlMap = new Map();
  const dataUrlMap = new Map();
  const dataUrlHashMap = new Map();
  const assetCodeMap = new Map();

  const duplicateScanUrls = [];
  const duplicateDataUrls = [];
  const duplicateAssetCodes = [];
  const scanUrlMismatch = [];

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const code = item.assetCode;
    const scanUrl = item.qrCode?.scanUrl;
    const dataUrl = item.qrCode?.dataUrl;

    // 1. Asset Code uniqueness
    if (assetCodeMap.has(code)) {
      duplicateAssetCodes.push({ code, originalId: assetCodeMap.get(code), currentId: item._id });
    } else {
      assetCodeMap.set(code, item._id);
    }

    // 2. Scan URL uniqueness & integrity
    if (!scanUrl) {
      duplicateScanUrls.push({ code, error: 'Missing qrCode.scanUrl' });
    } else {
      if (scanUrlMap.has(scanUrl)) {
        duplicateScanUrls.push({ scanUrl, code, firstSeenWithCode: scanUrlMap.get(scanUrl) });
      } else {
        scanUrlMap.set(scanUrl, code);
      }

      // Check that scanUrl matches the asset code
      if (!scanUrl.endsWith(`/scan/${code}`)) {
        scanUrlMismatch.push({ code, scanUrl });
      }
    }

    // 3. Data URL uniqueness
    if (!dataUrl) {
      duplicateDataUrls.push({ code, error: 'Missing qrCode.dataUrl' });
    } else {
      // Calculate SHA-256 of the dataUrl base64 payload to ensure 100% byte-level uniqueness
      const hash = crypto.createHash('sha256').update(dataUrl).digest('hex');
      if (dataUrlHashMap.has(hash)) {
        duplicateDataUrls.push({
          code,
          firstSeenWithCode: dataUrlHashMap.get(hash),
          hash: hash.substring(0, 16),
        });
      } else {
        dataUrlHashMap.set(hash, code);
        dataUrlMap.set(dataUrl, code);
      }
    }
  }

  // 4. Test sibling chairs in lots
  // For each lot, make sure every chair has a completely distinct QR code from its siblings
  const lots = new Map();
  items.forEach(item => {
    if (!lots.has(item.lotCode)) lots.set(item.lotCode, []);
    lots.get(item.lotCode).push(item);
  });

  let lotsWithDuplicateQr = 0;
  for (const [lotCode, units] of lots.entries()) {
    const lotQrUrls = new Set(units.map(u => u.qrCode.scanUrl));
    const lotDataUrls = new Set(units.map(u => u.qrCode.dataUrl));
    if (lotQrUrls.size !== units.length || lotDataUrls.size !== units.length) {
      lotsWithDuplicateQr++;
      console.error(`Lot ${lotCode} has duplicate QRs among its ${units.length} units!`);
    }
  }

  console.log('\n--- UNIQUENESS SUMMARY ---');
  console.log(`✓ Total physical units examined : ${items.length}`);
  console.log(`✓ Unique Asset Codes           : ${assetCodeMap.size} / ${items.length}`);
  console.log(`✓ Unique QR Scan URLs          : ${scanUrlMap.size} / ${items.length}`);
  console.log(`✓ Unique QR PNG Data URLs      : ${dataUrlMap.size} / ${items.length}`);
  console.log(`✓ Unique SHA-256 Image Hashes  : ${dataUrlHashMap.size} / ${items.length}`);
  console.log(`✓ Office lots checked          : ${lots.size}`);
  console.log(`✓ Lots with duplicate QRs      : ${lotsWithDuplicateQr}`);
  console.log(`✓ Scan URL code mismatches     : ${scanUrlMismatch.length}`);

  console.log('\n--- SAMPLE QR VERIFICATION (Lot MBMC-LOT-0001 Chairs) ---');
  const sampleLotUnits = items.filter(i => i.lotCode === 'MBMC-LOT-0001');
  sampleLotUnits.forEach(u => {
    const hash = crypto.createHash('sha256').update(u.qrCode.dataUrl).digest('hex').substring(0, 12);
    console.log(`  [Unit ${u.unitNumber}/${u.totalUnitsInLot}] ${u.assetCode} -> scanUrl: ${u.qrCode.scanUrl} (SHA256: ${hash}...)`);
  });

  console.log('\n====================================================');
  if (
    duplicateAssetCodes.length === 0 &&
    duplicateScanUrls.length === 0 &&
    duplicateDataUrls.length === 0 &&
    scanUrlMismatch.length === 0 &&
    lotsWithDuplicateQr === 0
  ) {
    console.log(' \x1b[32m✔ 100% CONFIRMED: EVERY SINGLE QR CODE IS 100% UNIQUE!\x1b[0m');
    console.log('   Every individual chair/asset has its own distinct QR code,');
    console.log('   unique destination URL, and unique binary image payload.');
  } else {
    console.error(' \x1b[31m✘ DUPLICATES FOUND:\x1b[0m');
    if (duplicateAssetCodes.length > 0) console.error('Duplicate Asset Codes:', duplicateAssetCodes);
    if (duplicateScanUrls.length > 0) console.error('Duplicate Scan URLs:', duplicateScanUrls);
    if (duplicateDataUrls.length > 0) console.error('Duplicate Data URLs:', duplicateDataUrls);
    if (scanUrlMismatch.length > 0) console.error('Scan URL Mismatches:', scanUrlMismatch);
  }
  console.log('====================================================\n');

  await mongoose.connection.close();
  process.exit(
    duplicateAssetCodes.length === 0 &&
    duplicateScanUrls.length === 0 &&
    duplicateDataUrls.length === 0
      ? 0
      : 1
  );
}

verifyAllQrUnique().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
