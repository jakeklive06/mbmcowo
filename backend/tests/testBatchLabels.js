async function test() {
  const t0 = Date.now();
  console.log('Testing /api/qr/batch-labels?limit=all ...');
  const res = await fetch('http://localhost:5000/api/qr/batch-labels?limit=all');
  console.log('Status:', res.status, res.headers.get('content-type'));
  const html = await res.text();
  const dur = Date.now() - t0;
  console.log(`Fetched in ${dur}ms! HTML size: ${(html.length / (1024 * 1024)).toFixed(2)} MB`);
  
  // Count how many tag-card elements are in the HTML
  const matches = html.match(/class="tag-card"/g) || [];
  console.log(`Tag cards rendered in HTML: ${matches.length} / 3443`);
}

test().catch(console.error);
