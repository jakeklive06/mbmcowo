require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Item = require('../models/Item');
const { parseAllDocxFiles } = require('../services/docxParserService');
const { generateQrDataUrl } = require('../services/qrService');

async function seedDatabase() {
  console.log('====================================================');
  console.log('   MBMC Asset Management - Data Seeding & Ingestion  ');
  console.log('====================================================');

  await connectDB();

  const dataDir = path.join(__dirname, '../../data');
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

  console.log(`[Seed] Scanning directory: ${dataDir}`);
  const { allItems, fileSummary } = parseAllDocxFiles(dataDir);

  if (!allItems || allItems.length === 0) {
    console.error('[Seed] No items found in docx files!');
    process.exit(1);
  }

  console.log(`[Seed] Clearing existing items in MongoDB...`);
  await Item.deleteMany({});
  console.log(`[Seed] Collection cleared.`);

  console.log(`[Seed] Expanding ${allItems.length} survey rows into individual physical unit assets...`);

  const documentsToInsert = [];
  let totalUsable = 0;
  let totalDamaged = 0;
  let totalCount = 0;
  let lotCounter = 0;

  // Process rows and build individual unit items
  const unitsToGenerate = [];

  for (let rIdx = 0; rIdx < allItems.length; rIdx++) {
    const raw = allItems[rIdx];
    const usableCount = parseInt(raw.usableQty, 10) || 0;
    const damagedCount = parseInt(raw.damagedQty, 10) || 0;
    const rowTotal = parseInt(raw.totalQty, 10) || 0;
    const totalCountInRow = Math.max(rowTotal, usableCount + damagedCount);

    // If no physical units exist in this row, skip
    if (totalCountInRow <= 0) {
      continue;
    }

    lotCounter++;
    const lotSeq = lotCounter.toString().padStart(4, '0');
    const lotCode = `MBMC-LOT-${lotSeq}`;
    const modelBase = `MBMC-MOD-${lotSeq}`;

    totalUsable += usableCount;
    totalDamaged += (totalCountInRow - usableCount);
    totalCount += totalCountInRow;

    for (let u = 1; u <= totalCountInRow; u++) {
      const unitPad = u.toString().padStart(2, '0');
      const assetCode = `MBMC-AST-${lotSeq}-${unitPad}`;
      const modelNumber = `${modelBase}-${unitPad}`;
      const unitLabel = `Unit ${u} of ${totalCountInRow}`;

      // First usableCount units are Operational, remainder are Damaged
      const isUsable = u <= usableCount;
      const status = isUsable ? 'Operational' : 'Damaged';
      const conditionSummary = isUsable
        ? 'Operational / Fine (Good condition)'
        : 'Damaged / Broken (Requires maintenance/repair)';

      unitsToGenerate.push({
        ...raw,
        assetCode,
        modelNumber,
        lotCode,
        unitNumber: u,
        totalUnitsInLot: totalCountInRow,
        unitLabel,
        usableQty: isUsable ? 1 : 0,
        damagedQty: isUsable ? 0 : 1,
        totalQty: 1,
        lotUsableQty: usableCount,
        lotDamagedQty: damagedCount,
        lotTotalQty: totalCountInRow,
        status,
        conditionSummary,
        scanUrl: `${baseUrl}/scan/${assetCode}`,
      });
    }
  }

  console.log(`[Seed] Generating unique QR Codes for ${unitsToGenerate.length} individual items...`);

  // Generate QR codes in batches of 100 for high performance
  const BATCH_SIZE = 100;
  for (let b = 0; b < unitsToGenerate.length; b += BATCH_SIZE) {
    const chunk = unitsToGenerate.slice(b, b + BATCH_SIZE);
    await Promise.all(
      chunk.map(async (item) => {
        const qrDataUrl = await generateQrDataUrl(item.scanUrl);
        documentsToInsert.push({
          ...item,
          qrCode: {
            dataUrl: qrDataUrl,
            scanUrl: item.scanUrl,
          },
          auditHistory: [
            {
              action: 'Initial Import',
              status: item.status,
              usableQty: item.usableQty,
              damagedQty: item.damagedQty,
              notes: `Individual asset tagged from survey lot ${item.lotCode} (${item.unitLabel}) in file: ${item.sourceFile}`,
              reportedBy: 'System Ingestion Script',
              timestamp: new Date(),
            },
          ],
        });
      })
    );

    const processed = Math.min(b + BATCH_SIZE, unitsToGenerate.length);
    if (processed % 500 === 0 || processed === unitsToGenerate.length) {
      console.log(` - Generated QR codes for ${processed} / ${unitsToGenerate.length} items`);
    }
  }

  console.log(`[Seed] Inserting ${documentsToInsert.length} documents into MongoDB...`);
  await Item.insertMany(documentsToInsert);

  // Also write backup file so importDatabase can restore immediately
  const backupPath = path.join(__dirname, '../../data/mbmc_assets_backup.json');
  console.log(`[Seed] Saving updated backup file to: ${backupPath}`);
  fs.writeFileSync(backupPath, JSON.stringify(documentsToInsert, null, 2), 'utf-8');

  console.log('\n====================================================');
  console.log('           SEEDING COMPLETED SUCCESSFULLY           ');
  console.log('====================================================');
  console.log(` - Total Survey Lots / Offices  : ${lotCounter}`);
  console.log(` - Total Individual Items / QRs : ${documentsToInsert.length}`);
  console.log(` - Total Usable Items (Fine)    : ${totalUsable}`);
  console.log(` - Total Damaged Items (Broken) : ${totalDamaged}`);
  console.log(` - Base Scan URL Pattern        : ${baseUrl}/scan/MBMC-AST-XXXX-XX`);
  console.log('====================================================\n');

  await mongoose.connection.close();
  console.log('[Seed] Database connection closed.');
}

if (require.main === module) {
  seedDatabase().catch((err) => {
    console.error('[Seed Error]:', err);
    process.exit(1);
  });
}

module.exports = seedDatabase;
