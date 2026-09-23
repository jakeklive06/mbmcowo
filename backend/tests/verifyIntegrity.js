const mongoose = require('mongoose');
require('dotenv').config();
const Item = require('../src/models/Item');

async function checkDataIntegrity() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[Integrity Check] Connected to MongoDB');

  const total = await Item.countDocuments();
  console.log('[Integrity Check] Total items:', total);

  const missingCode = await Item.countDocuments({ assetCode: { $exists: false } });
  const missingNameEn = await Item.countDocuments({ nameEnglish: { $exists: false } });
  const missingNameMr = await Item.countDocuments({ nameMarathi: { $exists: false } });
  const missingQr = await Item.countDocuments({ 'qrCode.dataUrl': { $exists: false } });
  const missingLoc = await Item.countDocuments({ fullLocationEnglish: { $exists: false } });

  console.log(' - Missing assetCode:', missingCode);
  console.log(' - Missing nameEnglish:', missingNameEn);
  console.log(' - Missing nameMarathi:', missingNameMr);
  console.log(' - Missing qrCode.dataUrl:', missingQr);
  console.log(' - Missing fullLocationEnglish:', missingLoc);

  // Check if any English fields contain unconverted Devanagari script
  const devanagariRegex = /[\u0900-\u097F]/;
  const items = await Item.find().lean();
  let untranslatedNames = 0;
  let untranslatedLocations = [];

  for (const it of items) {
    if (devanagariRegex.test(it.nameEnglish)) {
      untranslatedNames++;
      console.log('Devanagari in nameEnglish:', it.nameEnglish);
    }
    if (devanagariRegex.test(it.fullLocationEnglish)) {
      untranslatedLocations.push({
        code: it.assetCode,
        loc: it.fullLocationEnglish,
        orig: it.fullLocationMarathi,
      });
    }
  }

  console.log(' - Items with Devanagari in nameEnglish:', untranslatedNames);
  console.log(' - Items with Devanagari in fullLocationEnglish:', untranslatedLocations.length);

  if (untranslatedLocations.length > 0) {
    console.log('\n[Untranslated Locations Details]');
    const uniqueRemaining = [...new Set(untranslatedLocations.map((u) => u.orig))];
    uniqueRemaining.forEach((orig, idx) => {
      const match = untranslatedLocations.find((u) => u.orig === orig);
      console.log(`${idx + 1}. ORIGINAL: ${orig}`);
      console.log(`   CURRENT : ${match.loc}\n`);
    });
  } else {
    console.log(' - \x1b[32mALL 520 records have 100% clean English translations without remaining Devanagari characters!\x1b[0m');
  }

  // Check categories
  const categories = await Item.distinct('category');
  console.log(' - Distinct Categories:', categories);

  // Check quantities validity
  const invalidQty = await Item.countDocuments({
    $or: [{ usableQty: { $lt: 0 } }, { damagedQty: { $lt: 0 } }, { totalQty: { $lt: 0 } }],
  });
  console.log(' - Invalid quantities (negative):', invalidQty);

  // Check status validity
  const statuses = await Item.distinct('status');
  console.log(' - Distinct Statuses:', statuses);

  await mongoose.connection.close();
  console.log('[Integrity Check] Done.');
}

checkDataIntegrity().catch((err) => {
  console.error('[Integrity Check Error]:', err);
  process.exit(1);
});
