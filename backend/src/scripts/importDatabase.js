require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Item = require('../models/Item');

async function importDatabase() {
  console.log('====================================================');
  console.log('   MBMC Asset Management - Import Database Backup   ');
  console.log('====================================================');

  await connectDB();

  const inputPath = path.join(__dirname, '../../data/mbmc_assets_backup.json');
  if (!fs.existsSync(inputPath)) {
    console.error(`[Import Error] Backup file not found at: ${inputPath}`);
    console.error('Make sure you have mbmc_assets_backup.json inside backend/data/ folder.');
    process.exit(1);
  }

  console.log(`[Import] Reading backup file: ${inputPath}`);
  const rawData = fs.readFileSync(inputPath, 'utf-8');
  const items = JSON.parse(rawData);

  console.log(`[Import] Loaded ${items.length} records from backup file.`);
  console.log(`[Import] Clearing existing items in collection...`);
  await Item.deleteMany({});

  console.log(`[Import] Inserting ${items.length} items into MongoDB...`);
  await Item.insertMany(items);

  console.log('\n====================================================');
  console.log('         DATABASE RESTORED SUCCESSFULLY             ');
  console.log(` - Total Records Imported: ${items.length}`);
  console.log('====================================================\n');

  await mongoose.connection.close();
  process.exit(0);
}

importDatabase().catch((err) => {
  console.error('[Import Error]:', err);
  process.exit(1);
});
