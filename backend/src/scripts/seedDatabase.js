require('dotenv').config();
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

  console.log(`[Seed] Generating unique Asset Codes and QR Codes for ${allItems.length} records...`);

  const documentsToInsert = [];
  let totalUsable = 0;
  let totalDamaged = 0;
  let totalCount = 0;

  for (let i = 0; i < allItems.length; i++) {
    const raw = allItems[i];
    const seq = (i + 1).toString().padStart(4, '0');
    const assetCode = `MBMC-AST-${seq}`;
    const modelNumber = `MBMC-MOD-${seq}`;
    const scanUrl = `${baseUrl}/scan/${assetCode}`;

    const qrDataUrl = await generateQrDataUrl(scanUrl);

    totalUsable += raw.usableQty;
    totalDamaged += raw.damagedQty;
    totalCount += raw.totalQty;

    documentsToInsert.push({
      ...raw,
      assetCode,
      modelNumber,
      qrCode: {
        dataUrl: qrDataUrl,
        scanUrl,
      },
      auditHistory: [
        {
          action: 'Initial Import',
          status: raw.status,
          usableQty: raw.usableQty,
          damagedQty: raw.damagedQty,
          notes: `Ingested from official MBMC survey file: ${raw.sourceFile}`,
          reportedBy: 'System Ingestion Script',
        },
      ],
    });

    if ((i + 1) % 100 === 0 || i + 1 === allItems.length) {
      console.log(` - Processed ${i + 1} / ${allItems.length} items with QR codes`);
    }
  }

  console.log(`[Seed] Inserting documents into MongoDB...`);
  await Item.insertMany(documentsToInsert);

  console.log('\n====================================================');
  console.log('           SEEDING COMPLETED SUCCESSFULLY           ');
  console.log('====================================================');
  console.log(` - Total Asset Records Ingested : ${documentsToInsert.length}`);
  console.log(` - Total Usable Physical Items  : ${totalUsable}`);
  console.log(` - Total Damaged Physical Items : ${totalDamaged}`);
  console.log(` - Overall Physical Item Count  : ${totalCount}`);
  console.log(` - Base Scan URL Pattern        : ${baseUrl}/scan/MBMC-AST-XXXX`);
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
