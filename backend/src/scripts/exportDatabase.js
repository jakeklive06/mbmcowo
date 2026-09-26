require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Item = require('../models/Item');

async function exportDatabase() {
  console.log('====================================================');
  console.log('   MBMC Asset Management - Export Database Backup   ');
  console.log('====================================================');

  await connectDB();

  const outputPath = path.join(__dirname, '../../data/mbmc_assets_backup.json');
  console.log(`[Export] Fetching all items from MongoDB...`);

  const items = await Item.find({}).lean();
  console.log(`[Export] Found ${items.length} records.`);

  if (items.length === 0) {
    console.warn('[Export] Warning: Database is empty! Nothing to export.');
    await mongoose.connection.close();
    process.exit(0);
  }

  fs.writeFileSync(outputPath, JSON.stringify(items, null, 2), 'utf-8');
  console.log(`[Export] Successfully saved ${items.length} items to:`);
  console.log(`         ${outputPath}`);
  console.log('====================================================');

  await mongoose.connection.close();
  process.exit(0);
}

exportDatabase().catch((err) => {
  console.error('[Export Error]:', err);
  process.exit(1);
});
