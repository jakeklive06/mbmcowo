async function testScanResponses() {
  const codes = [
    'MBMC-AST-0001-01',
    'MBMC-AST-0001-05',
    'MBMC-AST-0002-01',
    'MBMC-AST-0100-01',
    'MBMC-AST-0447-01',
  ];

  for (const code of codes) {
    const res = await fetch(`http://localhost:5000/scan/${code}`);
    const html = await res.text();
    const hasCode = html.includes(code);
    console.log(`Scan endpoint for ${code}: HTTP ${res.status} | Contains correct code: ${hasCode}`);
  }
}

testScanResponses().catch(console.error);
