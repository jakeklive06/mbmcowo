const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const {
  translateItem,
  translateLocation,
  extractFloor,
  extractDepartment,
  FILE_MAP,
} = require('./translationService');

/**
 * Extracts plain text from an XML fragment containing w:t elements
 */
function extractTextFromXml(xmlString) {
  const matches = xmlString.match(/<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>/g) || [];
  return matches
    .map((m) => {
      const match = m.match(/<w:t(?:\s+[^>]*)?>([\s\S]*?)<\/w:t>/);
      return match ? match[1] : '';
    })
    .join('')
    .trim();
}

/**
 * Parses a single MBMC survey docx file
 */
function parseDocxFile(filePath) {
  const fileName = path.basename(filePath);
  const fileMeta = FILE_MAP[fileName] || {
    buildingEnglish: 'MBMC Office Building',
    ward: 'MBMC',
    floorDefault: 'Ground Floor',
  };

  const zip = new AdmZip(filePath);
  const docEntry = zip.getEntry('word/document.xml');
  if (!docEntry) {
    throw new Error(`word/document.xml not found in ${fileName}`);
  }

  const xmlContent = zip.readAsText(docEntry);

  // Match all rows
  const rowMatches = xmlContent.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
  if (rowMatches.length === 0) {
    return [];
  }

  const items = [];
  let currentLocationMarathi = '';

  // Row 0 is the table header: ['अ.क्र.', 'वास्तुचे नाव', 'वस्तुचे नाव', 'वापरास योग्य वस्तुंची संख्या', 'नादुरूस्त वस्तुंची संख्या', 'एकुण वस्तुंची संख्या']
  for (let rIdx = 1; rIdx < rowMatches.length; rIdx++) {
    const rowXml = rowMatches[rIdx];
    const cellMatches = rowXml.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];

    if (cellMatches.length < 6) continue;

    const srNo = extractTextFromXml(cellMatches[0]);
    const locationCell = extractTextFromXml(cellMatches[1]);
    const itemNameMarathi = extractTextFromXml(cellMatches[2]);
    const usableStr = extractTextFromXml(cellMatches[3]);
    const damagedStr = extractTextFromXml(cellMatches[4]);
    const totalStr = extractTextFromXml(cellMatches[5]);

    // Update current location if this row has one
    if (locationCell) {
      currentLocationMarathi = locationCell;
    }

    // Skip blank spacer rows without an item name
    if (!itemNameMarathi) {
      continue;
    }

    const usableQty = parseInt(usableStr, 10) || 0;
    const damagedQty = parseInt(damagedStr, 10) || 0;
    const totalQty = parseInt(totalStr, 10) || usableQty + damagedQty;

    // Translation & parsing
    const itemTranslation = translateItem(itemNameMarathi);
    const fullLocationEnglish = translateLocation(currentLocationMarathi);
    const floorInfo = extractFloor(currentLocationMarathi, fileMeta.floorDefault);
    const deptInfo = extractDepartment(currentLocationMarathi, fullLocationEnglish);

    // Operational status calculation
    let status = 'Operational';
    if (totalQty === 0) {
      status = 'Operational';
    } else if (usableQty === 0 && damagedQty > 0) {
      status = 'Damaged';
    } else if (damagedQty > 0) {
      status = 'Partially Damaged';
    }

    const conditionSummary = `${usableQty} Usable, ${damagedQty} Damaged (Total: ${totalQty})`;

    items.push({
      nameEnglish: itemTranslation.name,
      nameMarathi: itemNameMarathi,
      category: itemTranslation.category,
      departmentEnglish: deptInfo.departmentEnglish,
      departmentMarathi: deptInfo.departmentMarathi,
      buildingEnglish: fileMeta.buildingEnglish,
      buildingMarathi: 'मिरा भाईंदर महानगरपालिका',
      floorEnglish: floorInfo.floorEnglish,
      floorMarathi: floorInfo.floorMarathi,
      ward: fileMeta.ward,
      fullLocationEnglish: fullLocationEnglish || fileMeta.buildingEnglish,
      fullLocationMarathi: currentLocationMarathi,
      usableQty,
      damagedQty,
      totalQty,
      status,
      conditionSummary,
      sourceFile: fileName,
    });
  }

  return items;
}

/**
 * Parses all 15 survey docx files in the data directory
 */
function parseAllDocxFiles(dataDir) {
  const files = fs
    .readdirSync(dataDir)
    .filter((f) => f.endsWith('.docx'))
    .sort();

  console.log(`[DocxParser] Found ${files.length} docx files in ${dataDir}`);

  let allItems = [];
  let fileSummary = [];

  for (const f of files) {
    const fullPath = path.join(dataDir, f);
    const items = parseDocxFile(fullPath);
    allItems = allItems.concat(items);
    fileSummary.push({ file: f, count: items.length });
    console.log(` - ${f}: ${items.length} records parsed`);
  }

  console.log(`[DocxParser] Successfully parsed ${allItems.length} total asset records.`);
  return { allItems, fileSummary };
}

module.exports = {
  parseDocxFile,
  parseAllDocxFiles,
};
