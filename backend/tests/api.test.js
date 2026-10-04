/**
 * Automated Verification Test Suite for MBMC Asset QR Management Backend
 */
require('dotenv').config({ path: '.env' });
process.env.NODE_ENV = 'test';

const http = require('http');
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const app = require('../server');
const Item = require('../src/models/Item');

let server;
let port = 5099; // Isolated test port

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        ...options,
      },
      (res) => {
        let data = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(data);
          let json = null;
          try {
            json = JSON.parse(buffer.toString('utf-8'));
          } catch (e) {
            // Not JSON
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: buffer.toString('utf-8'),
            json,
            buffer,
          });
        });
      }
    );
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('       STARTING BACKEND API VERIFICATION TESTS       ');
  console.log('====================================================');

  await connectDB();

  server = app.listen(port);
  console.log(`[Test Server] Running on http://127.0.0.1:${port}\n`);

  let passed = 0;
  let failed = 0;

  async function assert(name, fn) {
    try {
      await fn();
      console.log(` \x1b[32m✔ PASS\x1b[0m - ${name}`);
      passed++;
    } catch (err) {
      console.error(` \x1b[31m✘ FAIL\x1b[0m - ${name}: ${err.message}`);
      failed++;
    }
  }

  // Test 1: Health Check
  await assert('GET /api/health should return ok', async () => {
    const res = await request({ path: '/api/health', method: 'GET' });
    if (res.statusCode !== 200 || !res.json || res.json.status !== 'ok') {
      throw new Error(`Unexpected response: ${res.statusCode} ${res.body}`);
    }
  });

  // Test 2: Ingested items count
  let sampleItem = null;
  await assert('Database should contain 3,443 seeded individual unit records', async () => {
    const count = await Item.countDocuments();
    if (count !== 3443) {
      throw new Error(`Expected 3443 items, found ${count}`);
    }
    sampleItem = await Item.findOne({ assetCode: 'MBMC-AST-0001-01' });
    if (!sampleItem) throw new Error('MBMC-AST-0001-01 not found');
  });

  // Test 3: Query Items list
  await assert('GET /api/items returns paginated items with valid translations and unit info', async () => {
    const res = await request({ path: '/api/items?limit=10', method: 'GET' });
    if (res.statusCode !== 200 || !res.json || !res.json.data || res.json.data.length !== 10) {
      throw new Error(`Failed to fetch items list: ${res.statusCode}`);
    }
    const first = res.json.data[0];
    if (!first.nameEnglish || !first.nameMarathi || !first.qrCode || !first.unitLabel) {
      throw new Error('Item missing bilingual names, QR code, or unitLabel');
    }
  });

  // Test 4: Search filter
  await assert('GET /api/items?search=chair searches case-insensitively', async () => {
    const res = await request({ path: '/api/items?search=chair', method: 'GET' });
    if (res.statusCode !== 200 || !res.json || res.json.data.length === 0) {
      throw new Error(`Expected search results for 'chair', got 0`);
    }
  });

  // Test 5: Fetch by Individual Unit Asset Code
  await assert('GET /api/items/code/MBMC-AST-0001-01 returns item with sibling units attached', async () => {
    const res = await request({ path: '/api/items/code/MBMC-AST-0001-01', method: 'GET' });
    if (res.statusCode !== 200 || !res.json || res.json.data.assetCode !== 'MBMC-AST-0001-01') {
      throw new Error(`Failed to retrieve by code: ${res.body}`);
    }
    if (!res.json.data.siblingUnits || res.json.data.siblingUnits.length === 0) {
      throw new Error('Response missing siblingUnits array');
    }
  });

  // Test 5B: Fetch by Office Lot Prefix (e.g. MBMC-AST-0001)
  await assert('GET /api/items/code/MBMC-AST-0001 resolves lot prefix with all office sibling units', async () => {
    const res = await request({ path: '/api/items/code/MBMC-AST-0001', method: 'GET' });
    if (res.statusCode !== 200 || !res.json || !res.json.data) {
      throw new Error(`Failed to retrieve by lot prefix: ${res.body}`);
    }
    if (res.json.data.siblingUnits.length !== 6) {
      throw new Error(`Expected 6 sibling units in Lot 1, got ${res.json.data.siblingUnits.length}`);
    }
  });

  // Test 5C: Universal Lookup (Unit Code or Model)
  await assert('GET /api/items/lookup/MBMC-AST-0001-05 resolves unit via universal lookup', async () => {
    const res = await request({ path: '/api/items/lookup/MBMC-AST-0001-05', method: 'GET' });
    if (res.statusCode !== 200 || !res.json || !res.json.data || res.json.data.assetCode !== 'MBMC-AST-0001-05') {
      throw new Error(`Lookup failed: ${res.body}`);
    }
  });

  // Test 6: Mobile QR scan view for individual chair unit
  await assert('GET /scan/MBMC-AST-0001-05 renders mobile verification with sibling chairs inventory', async () => {
    const res = await request({ path: '/scan/MBMC-AST-0001-05', method: 'GET' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (!res.body.includes('MBMC-AST-0001-05') || !res.body.includes('Office Inventory')) {
      throw new Error('Scan page missing unit code or Office Inventory section');
    }
  });

  // Test 6B: Web page lookup by Model Number
  await assert('GET /scan/MBMC-MOD-0001 renders item verification page via model', async () => {
    const res = await request({ path: '/scan/MBMC-MOD-0001', method: 'GET' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (!res.body.includes('MBMC-MOD-0001') || !res.body.includes('Water Supply Department')) {
      throw new Error('Model lookup page missing model number or details');
    }
  });

  // Test 6C: Search Portal Page
  await assert('GET /lookup renders dedicated search portal', async () => {
    const res = await request({ path: '/lookup', method: 'GET' });
    if (res.statusCode !== 200 || !res.body.includes('Asset & Model Search')) {
      throw new Error('Lookup portal not rendering properly');
    }
  });

  // Test 7: Streaming PNG QR image for individual unit
  await assert('GET /api/qr/MBMC-AST-0001-01/image streams valid PNG image', async () => {
    const res = await request({ path: '/api/qr/MBMC-AST-0001-01/image', method: 'GET' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}`);
    if (res.headers['content-type'] !== 'image/png') {
      throw new Error(`Expected image/png, got ${res.headers['content-type']}`);
    }
    // Check PNG signature: 89 50 4E 47
    if (res.buffer[0] !== 0x89 || res.buffer[1] !== 0x50 || res.buffer[2] !== 0x4e || res.buffer[3] !== 0x47) {
      throw new Error('Invalid PNG header');
    }
  });

  // Test 8: Printable Asset Tag Label for individual unit
  await assert('GET /api/qr/MBMC-AST-0001-01/label renders printable HTML label with unit number', async () => {
    const res = await request({ path: '/api/qr/MBMC-AST-0001-01/label', method: 'GET' });
    if (res.statusCode !== 200 || !res.body.includes('MBMC-AST-0001-01')) {
      throw new Error('Failed to generate printable label');
    }
  });

  // Test 9: Stats overview
  await assert('GET /api/stats/overview returns complete analytics for all 3,443 physical items', async () => {
    const res = await request({ path: '/api/stats/overview', method: 'GET' });
    if (res.statusCode !== 200 || !res.json || !res.json.data) {
      throw new Error('Stats overview failed');
    }
    const data = res.json.data;
    if (data.totalAssetRecords !== 3443 || data.physicalItems.total !== 3443) {
      throw new Error(`Unexpected stats counts: ${JSON.stringify(data)}`);
    }
  });

  // Test 10: Update item
  await assert('PUT /api/items/:id updates unit condition and logs audit history', async () => {
    const item = await Item.findOne({ assetCode: 'MBMC-AST-0001-02' });
    const payload = JSON.stringify({
      status: 'Damaged',
      notes: 'Broken backrest reported by officer',
      updatedBy: 'Test Inspector',
    });

    const res = await request(
      {
        path: `/api/items/${item._id}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      payload
    );

    if (res.statusCode !== 200 || !res.json || res.json.data.status !== 'Damaged') {
      throw new Error(`Failed to update item: ${res.body}`);
    }

    const updated = await Item.findById(item._id);
    const lastAudit = updated.auditHistory[updated.auditHistory.length - 1];
    if (lastAudit.status !== 'Damaged') {
      throw new Error('Audit history not recorded');
    }
  });

  // Test 11: Create new item with auto QR generation
  await assert('POST /api/items creates new item with auto-assigned code and QR', async () => {
    const payload = JSON.stringify({
      nameEnglish: 'Executive High-Back Chair',
      nameMarathi: 'कार्यकारी उच्च-बॅक खुर्ची',
      category: 'Seating',
      departmentEnglish: 'IT & Digital Governance Dept',
      departmentMarathi: 'माहिती तंत्रज्ञान विभाग',
      buildingEnglish: 'MBMC Main Head Office',
      buildingMarathi: 'मुख्य कार्यालय',
      floorEnglish: '3rd Floor',
      fullLocationEnglish: 'IT Dept, 3rd Floor, MBMC Main Head Office, Bhayandar (West)',
      fullLocationMarathi: 'माहिती तंत्रज्ञान विभाग, ३ रा मजला, मुख्य कार्यालय, भाईंदर (प.)',
      usableQty: 5,
      damagedQty: 0,
      totalQty: 5,
      ward: 'Head Office',
    });

    const res = await request(
      {
        path: '/api/items',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      payload
    );

    if (res.statusCode !== 201 || !res.json || !res.json.data.qrCode) {
      throw new Error(`Creation failed: ${res.body}`);
    }

    // Clean up created item
    await Item.findByIdAndDelete(res.json.data._id);
  });

  console.log('\n====================================================');
  console.log(`TESTS SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  server.close();
  await mongoose.connection.close();

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
