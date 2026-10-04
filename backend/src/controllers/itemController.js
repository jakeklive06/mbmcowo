const Item = require('../models/Item');
const { generateQrDataUrl } = require('../services/qrService');

/**
 * Helper to attach all sibling units in the same office/lot to an item response
 */
async function attachSiblingUnits(itemDoc) {
  if (!itemDoc) return null;
  const item = itemDoc.toObject ? itemDoc.toObject() : { ...itemDoc };
  if (item.lotCode) {
    const siblings = await Item.find({ lotCode: item.lotCode })
      .select('assetCode modelNumber unitNumber totalUnitsInLot unitLabel status conditionSummary qrCode.dataUrl usableQty damagedQty')
      .sort({ unitNumber: 1 })
      .lean();
    item.siblingUnits = siblings;
  } else {
    item.siblingUnits = [
      {
        assetCode: item.assetCode,
        modelNumber: item.modelNumber,
        unitNumber: item.unitNumber || 1,
        totalUnitsInLot: item.totalUnitsInLot || 1,
        unitLabel: item.unitLabel || 'Unit 1 of 1',
        status: item.status,
        conditionSummary: item.conditionSummary,
        qrCode: item.qrCode,
      },
    ];
  }
  return item;
}

/**
 * Get paginated list of items with rich filters and full-text search
 */
exports.getItems = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      building,
      ward,
      department,
      category,
      status,
      lotCode,
      hasDamaged,
      sortBy = 'assetCode',
      sortOrder = 'asc',
    } = req.query;

    const query = {};

    // Full-text / substring search across code, model, and names
    if (search && search.trim()) {
      const searchTerm = search.trim();
      query.$or = [
        { assetCode: { $regex: searchTerm, $options: 'i' } },
        { modelNumber: { $regex: searchTerm, $options: 'i' } },
        { lotCode: { $regex: searchTerm, $options: 'i' } },
        { unitLabel: { $regex: searchTerm, $options: 'i' } },
        { nameEnglish: { $regex: searchTerm, $options: 'i' } },
        { nameMarathi: { $regex: searchTerm, $options: 'i' } },
        { departmentEnglish: { $regex: searchTerm, $options: 'i' } },
        { departmentMarathi: { $regex: searchTerm, $options: 'i' } },
        { buildingEnglish: { $regex: searchTerm, $options: 'i' } },
        { fullLocationEnglish: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    if (req.query.modelNumber) {
      query.modelNumber = { $regex: req.query.modelNumber.trim(), $options: 'i' };
    }
    if (lotCode) query.lotCode = lotCode.trim();
    if (building) query.buildingEnglish = building;
    if (ward) query.ward = ward;
    if (department) query.departmentEnglish = department;
    if (category) query.category = category;
    if (status) query.status = status;
    if (hasDamaged === 'true') {
      query.$or = [{ status: 'Damaged' }, { damagedQty: { $gt: 0 } }];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [items, total] = await Promise.all([
      Item.find(query).sort(sortOptions).skip(skip).limit(limitNum).lean(),
      Item.countDocuments(query),
    ]);

    res.json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      count: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get item by MongoDB ID
 */
exports.getItemById = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    const itemWithSiblings = await attachSiblingUnits(item);
    res.json({ success: true, data: itemWithSiblings });
  } catch (error) {
    next(error);
  }
};

/**
 * Get item by Asset Code (e.g. MBMC-AST-0001-01 or MBMC-AST-0001)
 */
exports.getItemByCode = async (req, res, next) => {
  try {
    const code = req.params.code.toUpperCase().trim();
    let item = await Item.findOne({ assetCode: code });

    // If not found as exact unit code, check if it's a lot/group prefix
    if (!item) {
      item = await Item.findOne({
        $or: [
          { lotCode: code },
          { assetCode: { $regex: `^${code}-`, $options: 'i' } },
        ],
      }).sort({ unitNumber: 1 });
    }

    if (!item) {
      return res.status(404).json({ success: false, message: `Item with code ${code} not found` });
    }

    const itemWithSiblings = await attachSiblingUnits(item);
    res.json({ success: true, data: itemWithSiblings });
  } catch (error) {
    next(error);
  }
};

/**
 * Get item by Model Number (e.g. MBMC-MOD-0001-01 or MBMC-MOD-0001)
 */
exports.getItemByModel = async (req, res, next) => {
  try {
    const model = req.params.modelNumber.trim();
    const item = await Item.findOne({
      $or: [
        { modelNumber: model.toUpperCase() },
        { modelNumber: { $regex: `^${model}$`, $options: 'i' } },
        { modelNumber: { $regex: `^${model}-`, $options: 'i' } },
        { modelNumber: { $regex: model, $options: 'i' } },
      ],
    }).sort({ unitNumber: 1 });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `Item with model number "${model}" not found`,
      });
    }

    const itemWithSiblings = await attachSiblingUnits(item);
    res.json({ success: true, data: itemWithSiblings });
  } catch (error) {
    next(error);
  }
};

/**
 * Universal lookup by either Model Number OR Asset Code OR Lot Code
 */
exports.lookupItem = async (req, res, next) => {
  try {
    const queryTerm = req.params.query.trim();
    const upperQuery = queryTerm.toUpperCase();

    // 1. Try exact match on assetCode, modelNumber, lotCode
    let item = await Item.findOne({
      $or: [
        { assetCode: upperQuery },
        { modelNumber: upperQuery },
        { lotCode: upperQuery },
      ],
    });

    // 2. Try prefix/regex match (e.g. searching MBMC-AST-0001 matches MBMC-AST-0001-01)
    if (!item) {
      item = await Item.findOne({
        $or: [
          { assetCode: { $regex: `^${queryTerm}-`, $options: 'i' } },
          { modelNumber: { $regex: `^${queryTerm}-`, $options: 'i' } },
          { assetCode: { $regex: queryTerm, $options: 'i' } },
          { modelNumber: { $regex: queryTerm, $options: 'i' } },
          { lotCode: { $regex: queryTerm, $options: 'i' } },
        ],
      }).sort({ unitNumber: 1 });
    }

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `No item found matching "${queryTerm}" (searched asset codes, lot codes, and model numbers)`,
      });
    }

    const itemWithSiblings = await attachSiblingUnits(item);
    res.json({ success: true, data: itemWithSiblings });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new item manually with auto QR code generation
 */
exports.createItem = async (req, res, next) => {
  try {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    // Generate next sequential asset code and model number if not provided
    let assetCode = req.body.assetCode;
    let modelNumber = req.body.modelNumber;

    if (!assetCode || !modelNumber) {
      const lastItem = await Item.findOne({ assetCode: /^MBMC-AST-\d+$/ }).sort({ assetCode: -1 });
      let nextSeq = 1;
      if (lastItem && lastItem.assetCode && lastItem.assetCode.startsWith('MBMC-AST-')) {
        const lastNum = parseInt(lastItem.assetCode.replace('MBMC-AST-', ''), 10);
        if (!isNaN(lastNum)) nextSeq = lastNum + 1;
      }
      const seqStr = nextSeq.toString().padStart(4, '0');
      if (!assetCode) assetCode = `MBMC-AST-${seqStr}`;
      if (!modelNumber) modelNumber = `MBMC-MOD-${seqStr}`;
    } else {
      assetCode = assetCode.toUpperCase().trim();
      modelNumber = modelNumber.toUpperCase().trim();
    }

    const scanUrl = `${baseUrl}/scan/${assetCode}`;
    const qrDataUrl = await generateQrDataUrl(scanUrl);

    const usableQty = parseInt(req.body.usableQty, 10) || 0;
    const damagedQty = parseInt(req.body.damagedQty, 10) || 0;
    const totalQty = parseInt(req.body.totalQty, 10) || usableQty + damagedQty;

    let status = req.body.status || 'Operational';
    if (damagedQty > 0 && usableQty > 0) status = 'Partially Damaged';
    else if (damagedQty > 0 && usableQty === 0) status = 'Damaged';

    const item = new Item({
      ...req.body,
      assetCode,
      modelNumber,
      usableQty,
      damagedQty,
      totalQty,
      status,
      conditionSummary: `${usableQty} Usable, ${damagedQty} Damaged (Total: ${totalQty})`,
      qrCode: {
        dataUrl: qrDataUrl,
        scanUrl,
      },
      auditHistory: [
        {
          action: 'Initial Import',
          status,
          usableQty,
          damagedQty,
          notes: req.body.notes || 'Created via REST API',
          reportedBy: req.body.createdBy || 'API User',
        },
      ],
    });

    await item.save();
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

/**
 * Update item details
 */
exports.updateItem = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const { usableQty, damagedQty, status, notes, updatedBy } = req.body;

    if (status) {
      item.status = status;
      if (status === 'Operational') {
        item.usableQty = 1;
        item.damagedQty = 0;
        item.conditionSummary = 'Operational / Fine (Good condition)';
      } else if (status === 'Damaged') {
        item.usableQty = 0;
        item.damagedQty = 1;
        item.conditionSummary = 'Damaged / Broken (Requires maintenance/repair)';
      } else {
        item.conditionSummary = status;
      }
    } else if (usableQty !== undefined || damagedQty !== undefined) {
      const u = parseInt(usableQty, 10) || 0;
      const d = parseInt(damagedQty, 10) || 0;
      item.usableQty = u;
      item.damagedQty = d;
      item.status = d > 0 ? 'Damaged' : 'Operational';
      item.conditionSummary = item.status === 'Operational' ? 'Operational / Fine (Good condition)' : 'Damaged / Broken';
    }

    // Allow updating metadata fields
    if (req.body.nameEnglish) item.nameEnglish = req.body.nameEnglish;
    if (req.body.departmentEnglish) item.departmentEnglish = req.body.departmentEnglish;
    if (req.body.floorEnglish) item.floorEnglish = req.body.floorEnglish;
    if (req.body.buildingEnglish) item.buildingEnglish = req.body.buildingEnglish;

    // Log to audit history
    item.auditHistory.push({
      action: 'Status Update',
      status: item.status,
      usableQty: item.usableQty,
      damagedQty: item.damagedQty,
      notes: notes || `Item status updated to ${item.status}`,
      reportedBy: updatedBy || 'Officer / System',
      timestamp: new Date(),
    });

    item.lastAuditedAt = new Date();
    await item.save();

    // Sync lot counts across siblings if in a lot
    if (item.lotCode) {
      const lotUsable = await Item.countDocuments({ lotCode: item.lotCode, status: 'Operational' });
      const lotDamaged = await Item.countDocuments({ lotCode: item.lotCode, status: { $ne: 'Operational' } });
      await Item.updateMany({ lotCode: item.lotCode }, { lotUsableQty: lotUsable, lotDamagedQty: lotDamaged });
      item.lotUsableQty = lotUsable;
      item.lotDamagedQty = lotDamaged;
    }

    const itemWithSiblings = await attachSiblingUnits(item);
    res.json({ success: true, data: itemWithSiblings });
  } catch (error) {
    next(error);
  }
};

/**
 * Patch item status directly (e.g. quick damage report or repair completion)
 */
exports.patchStatus = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const { status, notes, reportedBy } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    item.status = status;
    if (status === 'Operational') {
      item.usableQty = 1;
      item.damagedQty = 0;
      item.conditionSummary = 'Operational / Fine (Good condition)';
    } else if (status === 'Damaged') {
      item.usableQty = 0;
      item.damagedQty = 1;
      item.conditionSummary = 'Damaged / Broken (Requires maintenance/repair)';
    }

    item.auditHistory.push({
      action: 'Status Update',
      status,
      usableQty: item.usableQty,
      damagedQty: item.damagedQty,
      notes: notes || `Status changed to ${status}`,
      reportedBy: reportedBy || 'System Auditor',
      timestamp: new Date(),
    });

    item.lastAuditedAt = new Date();
    await item.save();

    // Sync lot counts across siblings if in a lot
    if (item.lotCode) {
      const lotUsable = await Item.countDocuments({ lotCode: item.lotCode, status: 'Operational' });
      const lotDamaged = await Item.countDocuments({ lotCode: item.lotCode, status: { $ne: 'Operational' } });
      await Item.updateMany({ lotCode: item.lotCode }, { lotUsableQty: lotUsable, lotDamagedQty: lotDamaged });
      item.lotUsableQty = lotUsable;
      item.lotDamagedQty = lotDamaged;
    }

    const itemWithSiblings = await attachSiblingUnits(item);
    res.json({ success: true, data: itemWithSiblings });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete item
 */
exports.deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({ success: true, message: `Asset ${item.assetCode} deleted successfully` });
  } catch (error) {
    next(error);
  }
};

/**
 * Get distinct departments with asset counts
 */
exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await Item.aggregate([
      {
        $group: {
          _id: '$departmentEnglish',
          marathi: { $first: '$departmentMarathi' },
          count: { $sum: 1 },
          totalPhysicalQty: { $sum: 1 },
          damagedCount: { $sum: '$damagedQty' },
          usableCount: { $sum: '$usableQty' },
        },
      },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, data: departments });
  } catch (error) {
    next(error);
  }
};

/**
 * Get distinct buildings/wards with counts
 */
exports.getBuildings = async (req, res, next) => {
  try {
    const buildings = await Item.aggregate([
      {
        $group: {
          _id: '$buildingEnglish',
          ward: { $first: '$ward' },
          count: { $sum: 1 },
          totalPhysicalQty: { $sum: 1 },
          damagedCount: { $sum: '$damagedQty' },
          usableCount: { $sum: '$usableQty' },
        },
      },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, data: buildings });
  } catch (error) {
    next(error);
  }
};
