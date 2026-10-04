const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Item = require('../src/models/Item');

async function deepAudit() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mbmc_assets';
  await mongoose.connect(uri);

  const items = await Item.find({}).lean();
  console.log(`Checking ${items.length} assets...`);

  let emptyMarathi = items.filter(i => !i.nameMarathi || i.nameMarathi.trim() === '');
  let emptyEnglish = items.filter(i => !i.nameEnglish || i.nameEnglish.trim() === '');
  let emptyDeptMr = items.filter(i => !i.departmentMarathi || i.departmentMarathi.trim() === '');
  let emptyBldMr = items.filter(i => !i.buildingMarathi || i.buildingMarathi.trim() === '');
  let emptyFloorMr = items.filter(i => !i.floorMarathi || i.floorMarathi.trim() === '');
  let emptyLocMr = items.filter(i => !i.fullLocationMarathi || i.fullLocationMarathi.trim() === '');
  let emptyLocEn = items.filter(i => !i.fullLocationEnglish || i.fullLocationEnglish.trim() === '');

  console.log('Empty nameMarathi:', emptyMarathi.length);
  console.log('Empty nameEnglish:', emptyEnglish.length);
  console.log('Empty departmentMarathi:', emptyDeptMr.length);
  console.log('Empty buildingMarathi:', emptyBldMr.length);
  console.log('Empty floorMarathi:', emptyFloorMr.length);
  console.log('Empty fullLocationMarathi:', emptyLocMr.length);
  console.log('Empty fullLocationEnglish:', emptyLocEn.length);

  const operational = items.filter(i => i.status === 'Operational');
  const damaged = items.filter(i => i.status === 'Damaged');
  console.log('Operational units count:', operational.length);
  console.log('Damaged units count:', damaged.length);
  console.log('Total operational + damaged =', operational.length + damaged.length);

  const buildings = [...new Set(items.map(i => i.buildingEnglish))];
  console.log('\nUnique buildings (' + buildings.length + '):');
  buildings.forEach(b => {
    const count = items.filter(i => i.buildingEnglish === b).length;
    console.log(`  - ${b}: ${count} assets`);
  });

  const depts = [...new Set(items.map(i => i.departmentEnglish))];
  console.log(`\nUnique departments count: ${depts.length}`);
  depts.slice(0, 10).forEach(d => {
    const count = items.filter(i => i.departmentEnglish === d).length;
    console.log(`  - ${d}: ${count} assets`);
  });

  // Verify that all 3443 items have valid QR dataUrls
  let invalidQr = items.filter(i => !i.qrCode || !i.qrCode.dataUrl || !i.qrCode.dataUrl.startsWith('data:image/png;base64,'));
  console.log('\nInvalid QR Data URLs:', invalidQr.length);

  const itemsWithoutFloorMr = items.filter(i => !i.floorMarathi || i.floorMarathi.trim() === '');
  console.log('Items with empty floorMarathi:', itemsWithoutFloorMr.length);
  const floorEnMap = {};
  itemsWithoutFloorMr.forEach(i => {
    floorEnMap[i.floorEnglish] = (floorEnMap[i.floorEnglish] || 0) + 1;
  });
  console.log('floorEnglish for those items:', floorEnMap);

  const condSummaries = [...new Set(items.map(i => i.conditionSummary))];
  console.log('Distinct conditionSummary values:', condSummaries);

  // Check if status and conditionSummary correlate 100%
  const mismatchedSummary = items.filter(i => {
    if (i.status === 'Operational' && i.conditionSummary !== 'Operational (Fine)') return true;
    if (i.status === 'Damaged' && i.conditionSummary !== 'Damaged (Broken)') return true;
    return false;
  });
  console.log('Mismatched status vs conditionSummary:', mismatchedSummary.length);

  await mongoose.connection.close();
}

deepAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
