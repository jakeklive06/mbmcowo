const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Item = require('../src/models/Item');

async function fixAndReaudit() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mbmc_assets';
  await mongoose.connect(uri);

  const res = await Item.updateMany(
    { floorEnglish: 'Ground Floor', $or: [{ floorMarathi: '' }, { floorMarathi: null }] },
    { $set: { floorMarathi: 'तळ मजला' } }
  );
  console.log(`Updated ${res.modifiedCount} documents with proper floorMarathi = 'तळ मजला'.`);

  // Verify any remaining empty fields across all 3443 items
  const items = await Item.find({}).lean();
  let emptyFieldsCount = 0;
  for (const item of items) {
    const checkFields = ['nameEnglish', 'nameMarathi', 'departmentEnglish', 'departmentMarathi', 'buildingEnglish', 'buildingMarathi', 'floorEnglish', 'floorMarathi', 'fullLocationEnglish', 'fullLocationMarathi'];
    for (const f of checkFields) {
      if (!item[f] || item[f].trim() === '') {
        console.error(`Item ${item.assetCode} has empty field: ${f}`);
        emptyFieldsCount++;
      }
    }
  }

  console.log(`Total empty fields across all 3,443 assets: ${emptyFieldsCount}`);
  await mongoose.connection.close();
}

fixAndReaudit().catch(console.error);
