/**
 * Marathi to English Translation Service for MBMC Asset Management System
 */

// Exact mappings for all 29 unique item types found in MBMC documents
const ITEM_MAP = {
  '(लायब्ररी) कपाट': { name: 'Library Cupboard', category: 'Storage' },
  'अधिकारी खुर्ची': { name: 'Officer Chair', category: 'Seating' },
  'कक्ष टेबल': { name: 'Cabin Desk', category: 'Desks & Tables' },
  'कपाट': { name: 'Cupboard / Almirah', category: 'Storage' },
  'कॉन्फरन्स टेबल': { name: 'Conference Table', category: 'Desks & Tables' },
  'खुर्ची': { name: 'Chair', category: 'Seating' },
  'खुर्च्या': { name: 'Chairs', category: 'Seating' },
  'टेबल': { name: 'Office Table / Desk', category: 'Desks & Tables' },
  'ड्रॉ. कपाट': { name: 'Drawer Cabinet', category: 'Storage' },
  'ड्रॉवर': { name: 'Drawer Unit', category: 'Storage' },
  'पत्र्याची पेटी': { name: 'Metal Trunk / Storage Box', category: 'Storage' },
  'प्लास्टिक खुर्ची': { name: 'Plastic Chair', category: 'Seating' },
  'प्लास्टीक खुर्ची': { name: 'Plastic Chair', category: 'Seating' },
  'बसायचे बाकडे': { name: 'Sitting Bench', category: 'Seating' },
  'बाकडा': { name: 'Bench', category: 'Seating' },
  'बाकडे': { name: 'Benches', category: 'Seating' },
  'बाकडे (पॅसेज)': { name: 'Passage Bench', category: 'Seating' },
  'लहान टेबल': { name: 'Small Table', category: 'Desks & Tables' },
  'लाकडी कपाट': { name: 'Wooden Cupboard', category: 'Storage' },
  'लाकडी बाकडे': { name: 'Wooden Bench', category: 'Seating' },
  'लायब्ररी कपाट': { name: 'Library Cupboard', category: 'Storage' },
  'लॉकर कपाट': { name: 'Locker Cupboard', category: 'Storage' },
  'लोखंडी बाकडा': { name: 'Iron Bench', category: 'Seating' },
  'लोखंडी बाकडे': { name: 'Iron Benches', category: 'Seating' },
  'लोखंडी रॅक': { name: 'Iron Storage Rack', category: 'Storage' },
  'लोखंडी स्टँड': { name: 'Iron Stand', category: 'Fixtures & Stands' },
  'सोफा': { name: 'Sofa', category: 'Seating' },
  'सोफा सेट': { name: 'Sofa Set', category: 'Seating' },
  'स्टँड': { name: 'Stand', category: 'Fixtures & Stands' },
};

// Document title / Ward mapping
const FILE_MAP = {
  '1. विलासराव देशमुख भवन प्रभाग 04.docx': {
    buildingEnglish: 'Late Vilasrao Deshmukh Bhavan',
    ward: 'Ward 04',
    floorDefault: 'Multiple Floors',
  },
  '2. जुनी प्रभाग कार्यालय, भाईंदर (प.).docx': {
    buildingEnglish: 'Old Ward Office Building',
    ward: 'Bhayandar (West) Ward',
    floorDefault: 'Multiple Floors',
  },
  '3. प्रभाग 01.docx': {
    buildingEnglish: 'Ward Office 01 Building',
    ward: 'Ward 01',
    floorDefault: 'Multiple Floors',
  },
  '4. प्रभाग क्र. 02.docx': {
    buildingEnglish: 'Ward Office 02 Building',
    ward: 'Ward 02',
    floorDefault: 'Multiple Floors',
  },
  '5. प्रभाग कार्यालय क्र. 06.docx': {
    buildingEnglish: 'Ward Office 06 Building',
    ward: 'Ward 06',
    floorDefault: 'Ground Floor',
  },
  '6. प्रभाग कार्यालय क्र. 05.docx': {
    buildingEnglish: 'Ward Office 05 Building',
    ward: 'Ward 05',
    floorDefault: 'Ground Floor',
  },
  '7. मुख्य कार्यालय तळ मजला.docx': {
    buildingEnglish: 'MBMC Main Head Office',
    ward: 'Head Office',
    floorDefault: 'Ground Floor',
  },
  '8. प्रभाग कार्यालय क्र. 03.docx': {
    buildingEnglish: 'Ward Office 03 Building',
    ward: 'Ward 03',
    floorDefault: 'Multiple Floors',
  },
  '9. मुख्य कार्यालय पहिला मजला.docx': {
    buildingEnglish: 'MBMC Main Head Office',
    ward: 'Head Office',
    floorDefault: '1st Floor',
  },
  '10. नगररचना विभाग.docx': {
    buildingEnglish: 'Town Planning Department Building',
    ward: 'Town Planning',
    floorDefault: 'Multiple Floors',
  },
  '11. मुख्य कार्यालय 3 रा मजला.docx': {
    buildingEnglish: 'MBMC Main Head Office',
    ward: 'Head Office',
    floorDefault: '3rd Floor',
  },
  '12. मुख्य कार्यालय 2 रा मजला.docx': {
    buildingEnglish: 'MBMC Main Head Office',
    ward: 'Head Office',
    floorDefault: '2nd Floor',
  },
  '13. मुख्य कार्यालय 5 वा मजला.docx': {
    buildingEnglish: 'MBMC Main Head Office',
    ward: 'Head Office',
    floorDefault: '5th Floor',
  },
  '14. मुख्य कार्यालय 4था मजला.docx': {
    buildingEnglish: 'MBMC Main Head Office',
    ward: 'Head Office',
    floorDefault: '4th Floor',
  },
  '15. अग्निशमन केंद्र भाईंदर पश्चिम.docx': {
    buildingEnglish: 'Fire Station Building',
    ward: 'Fire Department Bhayandar (West)',
    floorDefault: 'Ground Floor',
  },
};

// Floor terms in Marathi to English
const FLOOR_MAP = [
  { marathi: 'तळ मजला', english: 'Ground Floor' },
  { marathi: 'पहिला मजला', english: '1st Floor' },
  { marathi: '1 ला मजला', english: '1st Floor' },
  { marathi: 'दुसरा मजला', english: '2nd Floor' },
  { marathi: '2 रा मजला', english: '2nd Floor' },
  { marathi: 'तिसरा मजला', english: '3rd Floor' },
  { marathi: '3 रा मजला', english: '3rd Floor' },
  { marathi: 'चौथा मजला', english: '4th Floor' },
  { marathi: '4था मजला', english: '4th Floor' },
  { marathi: '4 था मजला', english: '4th Floor' },
  { marathi: 'पाचवा मजला', english: '5th Floor' },
  { marathi: '5 वा मजला', english: '5th Floor' },
];

// Phrase dictionary for systematic location translation
const PHRASE_REPLACEMENTS = [
  // High-level officers & cabins
  ['शहर अभियंता दालन', 'City Engineer Cabin'],
  ['मुख्य लेखा व वित्त अधिकारी दालन', 'Chief Accounts & Finance Officer Cabin'],
  ['मुख्य लेखा परिक्षक दालन', 'Chief Auditor Cabin'],
  ['लेखा परिक्षण विभाग', 'Audit & Accounts Department'],
  ['शिक्षण अधिकारी दालन', 'Education Officer Cabin'],
  ['प्रभाग अधिकारी दालन', 'Ward Officer Cabin'],

  // Ward Committee Offices
  ['प्रभाग समिती कार्यालय क्र.01', 'Ward Committee Office No. 01'],
  ['प्रभाग समिती कार्यालय क्र. 01', 'Ward Committee Office No. 01'],
  ['प्रभाग समिती कार्यालय क्र.02', 'Ward Committee Office No. 02'],
  ['प्रभाग समिती कार्यालय क्र. 02', 'Ward Committee Office No. 02'],
  ['प्रभाग समिती कार्यालय क्र.03', 'Ward Committee Office No. 03'],
  ['प्रभाग समिती कार्यालय क्र. 03', 'Ward Committee Office No. 03'],
  ['प्रभाग समिती कार्यालय क्र.04', 'Ward Committee Office No. 04'],
  ['प्रभाग समिती कार्यालय क्र. 04', 'Ward Committee Office No. 04'],
  ['प्रभाग समिती कार्यालय क्र.05', 'Ward Committee Office No. 05'],
  ['प्रभाग समिती कार्यालय क्र. 05', 'Ward Committee Office No. 05'],
  ['प्रभाग समिती कार्यालय क्र.06', 'Ward Committee Office No. 06'],
  ['प्रभाग समिती कार्यालय क्र. 06', 'Ward Committee Office No. 06'],

  // Departments, Facilities & Sections
  ['स्व. कल्पना चावला, अग्निशमन केंद्र', 'Late Kalpana Chawla Fire Station'],
  ['स्व. कल्पना चावला अग्निशमन केंद्र', 'Late Kalpana Chawla Fire Station'],
  ['स्व. कल्पना चावला', 'Late Kalpana Chawla'],
  ['मालमत्ता व्यवस्थापन विभाग', 'Property & Asset Management Department'],
  ['भांडार विभाग', 'Stores & Inventory Department'],
  ['माहिती व तक्रार निवारण केंद्र', 'Information & Grievance Redressal Center'],
  ['मालमत्ता कर भरणा काऊंटर', 'Property Tax Payment Counter'],
  ['मालमत्ता कर विभाग', 'Property Tax Department'],
  ['महिला व बालकल्याण विभाग', 'Women & Child Welfare Department'],
  ['बाजार विभाग / पर्यावरण विभाग', 'Markets & Environment Department'],
  ['वाहन व यांत्रिकी विभाग', 'Vehicle & Mechanical Engineering Department'],
  ['विधी विभाग', 'Legal Department'],
  ['वाचनालय', 'Library & Reading Hall'],
  ['मुलींची अभ्यासिका', 'Girls Study Center'],
  ['मुलांची अभ्यासिका', 'Boys Study Center'],

  // Specific locations & landmarks
  ['काशिमिरा पोलीस स्टेशन समोर', 'Opposite Kashimira Police Station'],
  ['काशिमिरा', 'Kashimira'],
  ['आरक्षण क्र. 178', 'Plot Reservation No. 178'],
  ['डॉ. ए.पी.जे. अब्दुल कलाम', 'Dr. APJ Abdul Kalam'],
  ['हैदरी चौक', 'Haidari Chowk'],
  ['हायदरी चौक', 'Haidari Chowk'],
  ['नया नगर', 'Naya Nagar'],

  // Officer cabins
  ['श्री. मारुती गायकवाड, उप आयुक्त दालन', 'Mr. Maruti Gaikwad, Deputy Commissioner Cabin'],
  ['श्री. संजय शिंदे, उप आयुक्त दालन', 'Mr. Sanjay Shinde, Deputy Commissioner Cabin'],
  ['श्री. रवि पवार, उप आयुक्त दालन', 'Mr. Ravi Pawar, Deputy Commissioner Cabin'],
  ['श्री. सचिन बांगर, उपायुक्त मुख्यालय दालन', 'Mr. Sachin Bangar, Deputy Commissioner HQ Cabin'],
  ['श्री. स्वप्निल सावंत, उपायुक्त दालन', 'Mr. Swapnil Sawant, Deputy Commissioner Cabin'],
  ['श्रीम. कविता बोरकर, उपायुक्त दालन', 'Mrs. Kavita Borkar, Deputy Commissioner Cabin'],
  ['श्रीम. प्रणाली घोंगे, उपायुक्त, व कर विभाग कर्मचारी', 'Mrs. Pranali Ghonge, Deputy Commissioner & Tax Dept Staff'],
  ['श्री. अरविंद पाटील, उप अभियंता दालन', 'Mr. Arvind Patil, Deputy Engineer Cabin'],
  ['श्री. उत्तम रणदिवे, उप अभियंता दालन', 'Mr. Uttam Randive, Deputy Engineer Cabin'],
  ['श्री. यतिन जाधव, उप अभियंता दालन', 'Mr. Yatin Jadhav, Deputy Engineer Cabin'],
  ['श्री. राजेंद्र पांगळ, उप अभियंता दालन', 'Mr. Rajendra Pangal, Deputy Engineer Cabin'],
  ['श्री. सचिन पवार, उप अभियंता दालन', 'Mr. Sachin Pawar, Deputy Engineer Cabin'],
  ['श्री. सतिश तांडेल, उप अभियंता दालन', 'Mr. Satish Tandel, Deputy Engineer Cabin'],
  ['श्रीम. प्रांजल कदम, उप अभियंता दालन', 'Mrs. Pranjal Kadam, Deputy Engineer Cabin'],
  ['श्री. दिनेश कानगुडे, नगरसचिव दालन', 'Mr. Dinesh Kangude, Municipal Secretary Cabin'],
  ['श्रीम. शानु गोहिल, रौप्य महोत्सव वर्ष समिती अध्यक्षा दालन', 'Mrs. Shanu Gohil, Silver Jubilee Committee Chairperson Cabin'],

  // Committees & Chairs
  ['सभापती, आरोग्य, वैद्यकीय आरोग्य व पर्यावरण उद्यान व शहर सुशोभिकरण', 'Chairperson, Health, Environment & City Beautification Committee'],
  ['सभापती, पाणीपुरवठा व मलनिस्सारण समिती', 'Chairperson, Water Supply & Sewerage Committee'],
  ['सभापती, सभापती समाजकल्याण व झोपडपट्टी सुधारक समिती', 'Chairperson, Social Welfare & Slum Improvement Committee'],
  ['सभापती, सांस्कृतिक व शिक्षण क्रिडा', 'Chairperson, Cultural, Education & Sports Committee'],
  ['स्थायी समिती सभापती दालन', 'Standing Committee Chairperson Cabin'],
  ['सभागृह नेता दालन', 'Leader of the House Cabin'],
  ['विरोधी पक्ष नेता दालन', 'Leader of Opposition Cabin'],
  ['उप सभापती दालन', 'Vice Chairperson Cabin'],
  ['सभापती दालन', 'Chairperson Cabin'],
  ['अति. आयुक्त दालन', 'Additional Commissioner Cabin'],
  ['उपायुक्त दालन', 'Deputy Commissioner Cabin'],
  ['आयुक्त दालन', 'Municipal Commissioner Cabin'],
  ['उपमहापौर दालन', 'Deputy Mayor Cabin'],
  ['महापौर दालन', 'Mayor Cabin'],
  ['सहा. आयुक्त, आस्थापना विभाग', 'Assistant Commissioner, Establishment Department'],
  ['सहा. आयुक्त दालन', 'Assistant Commissioner Cabin'],
  ['सहा. आयुक्त कक्ष', 'Assistant Commissioner Room'],
  ['उद्यान अधिक्षक दालन', 'Garden Superintendent Cabin'],
  ['ग्रंथपाल दालन', 'Librarian Cabin'],
  ['समाज विकास अधिकारी दालन', 'Social Development Officer Cabin'],
  ['उप मुख्य स्वच्छता अधिकारी दालन', 'Deputy Chief Sanitation Officer Cabin'],
  ['उप लेखा व वित्त अधिकारी', 'Deputy Accounts & Finance Officer'],
  ['कार्यकारी अभियंता दालन', 'Executive Engineer Cabin'],
  ['कार्यकारी अभियंता', 'Executive Engineer'],
  ['उप अभियंता दालन', 'Deputy Engineer Cabin'],
  ['कनिष्ठ अभियंता दालन', 'Junior Engineer Cabin'],
  ['अभियंता कक्ष', 'Engineers Section'],
  ['अधिकारी कक्ष', 'Officers Section'],

  // Departments & Facilities
  ['पाणी पुरवठा विभाग', 'Water Supply Department'],
  ['कर विभाग', 'Property Tax Department'],
  ['बांधकाम विभाग', 'Public Works & Construction Department'],
  ['लेखा व वित्त विभाग', 'Accounts & Finance Department'],
  ['लेखा विभाग', 'Accounts Department'],
  ['सार्व. आरोग्य विभाग', 'Public Health Department'],
  ['आरोग्य केंद्र', 'Health Center'],
  ['आरोग्य विभाग', 'Health Department'],
  ['घनकचरा व्यवस्थापन विभाग', 'Solid Waste Management Department'],
  ['घनकचरा विभाग', 'Solid Waste Department'],
  ['नगररचना विभाग', 'Town Planning Department'],
  ['आपत्ती व्यवस्थापन विभाग', 'Disaster Management Department'],
  ['अग्निशमन केंद्र', 'Fire Station'],
  ['आस्थापना विभाग', 'Establishment / HR Department'],
  ['निवडणुक विभाग', 'Election Department'],
  ['आवक जावक विभाग', 'Inward & Outward Dispatch Department'],
  ['जन्म मृत्यु विभाग / दहन दफन', 'Birth & Death Registration / Cremation Section'],
  ['जन्म मृत्यु विभाग', 'Birth & Death Registration Department'],
  ['जाहिरात विभाग', 'Advertising & Signage Department'],
  ['परवाना विभाग', 'Licensing Department'],
  ['पशुसंवर्धन विभाग', 'Animal Husbandry Department'],
  ['समाज विकास विभाग', 'Social Development Department'],
  ['सामान्य प्रशासन विभाग', 'General Administration Department'],
  ['अतिक्रमण विभाग विभाग', 'Encroachment Removal Department'],
  ['अतिक्रमण विभाग', 'Encroachment Removal Department'],
  ['अभिलेख कक्ष', 'Records & Archives Room'],
  ['इमारत प्रस्ताव विभाग', 'Building Proposal Department'],
  ['उद्यान विभाग', 'Garden & Parks Department'],
  ['कर्मचारी कक्ष', 'Staff Room'],
  ['कर्मचारी वर्ग', 'Staff Section'],
  ['कॉन्फरन्स हॉल, स्व. लालबहादूर शास्त्री सभागृह', 'Conference Hall, Late Lal Bahadur Shastri Auditorium'],
  ['छोटा कॉन्फरन्स रूम, (सद्यस्थितीत ऑडीट विभाग)', 'Small Conference Room (Audit Dept)'],
  ['जनगणना विभाग, मध्यवर्ती नियंत्रण कक्ष', 'Census Department, Central Control Room'],
  ['जनसंपर्क विभाग', 'Public Relations Department'],
  ['टेलिफोन विभाग', 'Telephone / EPABX Department'],
  ['दिव्यांग कक्ष', 'Divyang (Disability Welfare) Cell'],
  ['नगरसचिव विभाग', 'Municipal Secretary Department'],
  ['नगरसचिव दालन', 'Municipal Secretary Cabin'],
  ['पाणी बिल भरणा काऊंटर', 'Water Bill Payment Counter'],
  ['पे ॲन्ड पार्क विभाग', 'Pay & Park Department'],
  ['फेरीवाला पथक', 'Hawker & Vendor Control Squad'],
  ['मराठी भाषा संवर्धन कक्ष', 'Marathi Language Promotion Cell'],
  ['माहिती व जनसंपर्क विभाग', 'Information & Public Relations Department'],
  ['माहिती अधिकार कक्ष', 'Right to Information (RTI) Cell'],
  ['विधि विभाग', 'Legal Department'],
  ['वाहन विभाग', 'Vehicle & Transport Department'],
  ['विद्युत विभाग', 'Electrical Engineering Department'],
  ['शिक्षण विभाग', 'Education Department'],
  ['सुरक्षा विभाग', 'Security Department'],
  ['सभागृह (हॉल)', 'Assembly Hall / Auditorium'],
  ['सी.सी.टी.व्ही. टेंडर विभाग', 'CCTV Tender Department'],
  ['स्कॅनिंग रूम', 'Scanning & Digitization Room'],
  ['स्वच्छ भारत अंमलबजावणी कक्ष', 'Swachh Bharat Mission Implementation Cell'],

  // Floors
  ['तळ मजला', 'Ground Floor'],
  ['पहिला मजला', '1st Floor'],
  ['1 ला मजला', '1st Floor'],
  ['दुसरा मजला', '2nd Floor'],
  ['2 रा मजला', '2nd Floor'],
  ['तिसरा मजला', '3rd Floor'],
  ['3 रा मजला', '3rd Floor'],
  ['चौथा मजला', '4th Floor'],
  ['4था मजला', '4th Floor'],
  ['4 था मजला', '4th Floor'],
  ['पाचवा मजला', '5th Floor'],
  ['5 वा मजला', '5th Floor'],

  // Buildings & Landmarks
  ['मुख्य कार्यालय', 'MBMC Main Head Office'],
  ['डॉ. बाबासाहेब आंबेडकर भवन (नगरभवन)', 'Dr. Babasaheb Ambedkar Bhavan (Nagar Bhavan)'],
  ['स्व. विलासराव देशमुख भवन', 'Late Vilasrao Deshmukh Bhavan'],
  ['स्व. कल्पना चावला, अग्निशमन केंद्र', 'Late Kalpana Chawla Fire Station'],
  ['स्व. कल्पना चावला अग्निशमन केंद्र', 'Late Kalpana Chawla Fire Station'],
  ['जुने प्रभाग कार्यालय', 'Old Ward Office'],
  ['जुनी प्रभाग कार्यालय', 'Old Ward Office'],
  ['प्रभाग समिती कार्यालय क्र.03', 'Ward Committee Office No. 03'],
  ['प्रभाग समिती कार्यालय क्र. 03', 'Ward Committee Office No. 03'],
  ['प्रभाग समिती कार्यालय क्र. 02', 'Ward Committee Office No. 02'],
  ['प्रभाग समिती कार्यालय क्र. 01', 'Ward Committee Office No. 01'],
  ['प्रभाग समिती कार्यालय क्र. 04', 'Ward Committee Office No. 04'],
  ['प्रभाग समिती कार्यालय क्र. 05', 'Ward Committee Office No. 05'],
  ['प्रभाग समिती कार्यालय क्र. 06', 'Ward Committee Office No. 06'],
  ['शुभम आर्केड', 'Shubham Arcade'],
  ['आर.बी.के. शाळेच्या बाजुला', 'Near RBK School'],
  ['मिरा भाईंदर महानगरपालिका', 'Mira Bhayandar Municipal Corporation'],

  // Locations / Areas
  ['भाईंदर (प.)', 'Bhayandar (West)'],
  ['भाईंदर (प)', 'Bhayandar (West)'],
  ['भाईंदर (पश्चिम)', 'Bhayandar (West)'],
  ['भाईंदर (पुर्व)', 'Bhayandar (East)'],
  ['भाईंदर (पूर्व)', 'Bhayandar (East)'],
  ['मिरारोड (पुर्व)', 'Mira Road (East)'],
  ['मिरारोड (पूर्व)', 'Mira Road (East)'],
  ['लक्ष्मी पार्क', 'Laxmi Park'],
  ['तलाव रोड', 'Talao Road'],
  ['पोलीस चौकी शेजारी', 'Near Police Station'],
  ['डीमार्ट जवळ', 'Near DMart'],
  ['कनाकिया', 'Kanakia'],
];

/**
 * Translates item name to English and returns category
 */
function translateItem(marathiItemName) {
  const clean = (marathiItemName || '').trim();
  if (ITEM_MAP[clean]) {
    return ITEM_MAP[clean];
  }

  // Fallback pattern matching
  if (clean.includes('खुर्ची') || clean.includes('खुर्च्या') || clean.includes('बाक')) {
    return { name: clean, category: 'Seating' };
  }
  if (clean.includes('टेबल')) {
    return { name: clean, category: 'Desks & Tables' };
  }
  if (clean.includes('कपाट') || clean.includes('रॅक') || clean.includes('पेटी') || clean.includes('ड्रॉ')) {
    return { name: clean, category: 'Storage' };
  }
  return { name: clean, category: 'Miscellaneous' };
}

/**
 * Extracts floor in English and Marathi from location string
 */
function extractFloor(marathiLocation, defaultFloor = 'Ground Floor') {
  for (const f of FLOOR_MAP) {
    if (marathiLocation && marathiLocation.includes(f.marathi)) {
      return { floorEnglish: f.english, floorMarathi: f.marathi };
    }
  }
  const defaultEntry = FLOOR_MAP.find((f) => f.english === defaultFloor);
  return {
    floorEnglish: defaultFloor,
    floorMarathi: defaultEntry ? defaultEntry.marathi : 'तळ मजला',
  };
}

/**
 * Translates full location string to English
 */
function translateLocation(marathiLocation) {
  if (!marathiLocation) return '';
  let result = marathiLocation;

  for (const [marathi, english] of PHRASE_REPLACEMENTS) {
    result = result.split(marathi).join(english);
  }

  // Clean trailing punctuation and multiple spaces
  result = result
    .replace(/\s+/g, ' ')
    .replace(/,\s*,/g, ', ')
    .replace(/\.+/g, '.')
    .replace(/^,\s*/, '')
    .replace(/,\s*$/, '')
    .trim()
    .replace(/\.$/, '');

  return result;
}

/**
 * Extracts primary department name from location
 */
function extractDepartment(marathiLocation, englishLocation) {
  if (!marathiLocation) return { departmentEnglish: 'General Admin', departmentMarathi: 'सामान्य प्रशासन' };

  // First section before the first comma is usually the department / cabin
  const mParts = marathiLocation.split(',').map((p) => p.trim());
  const eParts = englishLocation.split(',').map((p) => p.trim());

  return {
    departmentMarathi: mParts[0] || marathiLocation,
    departmentEnglish: eParts[0] || englishLocation,
  };
}

module.exports = {
  ITEM_MAP,
  FILE_MAP,
  FLOOR_MAP,
  translateItem,
  translateLocation,
  extractFloor,
  extractDepartment,
};
