async function testFilters() {
  const damagedRes = await fetch('http://localhost:5000/api/qr/batch-labels?status=Damaged');
  const damagedHtml = await damagedRes.text();
  const damagedMatches = damagedHtml.match(/class="tag-card"/g) || [];
  console.log(`Damaged tags filter: ${damagedMatches.length} / 139`);

  const buildingRes = await fetch('http://localhost:5000/api/qr/batch-labels?building=' + encodeURIComponent('Late Vilasrao Deshmukh Bhavan'));
  const bldHtml = await buildingRes.text();
  const bldMatches = bldHtml.match(/class="tag-card"/g) || [];
  console.log(`Vilasrao Deshmukh Bhavan tags: ${bldMatches.length} / 206`);

  const batchRes = await fetch('http://localhost:5000/api/qr/batch-labels?skip=0&limit=500');
  const batchHtml = await batchRes.text();
  const batchMatches = batchHtml.match(/class="tag-card"/g) || [];
  console.log(`Batch 1-500 tags: ${batchMatches.length} / 500`);
}

testFilters().catch(console.error);
