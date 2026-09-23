const Item = require('../models/Item');

/**
 * Get comprehensive overview stats
 */
exports.getOverview = async (req, res, next) => {
  try {
    const [totalRecords, aggregateCounts, statusBreakdown] = await Promise.all([
      Item.countDocuments(),
      Item.aggregate([
        {
          $group: {
            _id: null,
            totalPhysical: { $sum: '$totalQty' },
            totalUsable: { $sum: '$usableQty' },
            totalDamaged: { $sum: '$damagedQty' },
          },
        },
      ]),
      Item.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const counts = aggregateCounts[0] || { totalPhysical: 0, totalUsable: 0, totalDamaged: 0 };
    const healthRate = counts.totalPhysical > 0 ? ((counts.totalUsable / counts.totalPhysical) * 100).toFixed(1) : 100;

    res.json({
      success: true,
      data: {
        totalAssetRecords: totalRecords,
        physicalItems: {
          total: counts.totalPhysical,
          usable: counts.totalUsable,
          damaged: counts.totalDamaged,
          healthRatePercent: parseFloat(healthRate),
        },
        statusDistribution: statusBreakdown.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get stats grouped by Building / Ward
 */
exports.getByBuilding = async (req, res, next) => {
  try {
    const buildings = await Item.aggregate([
      {
        $group: {
          _id: '$buildingEnglish',
          ward: { $first: '$ward' },
          recordCount: { $sum: 1 },
          totalPhysicalQty: { $sum: '$totalQty' },
          usableQty: { $sum: '$usableQty' },
          damagedQty: { $sum: '$damagedQty' },
        },
      },
      { $sort: { totalPhysicalQty: -1 } },
    ]);

    res.json({ success: true, count: buildings.length, data: buildings });
  } catch (error) {
    next(error);
  }
};

/**
 * Get stats grouped by Department
 */
exports.getByDepartment = async (req, res, next) => {
  try {
    const departments = await Item.aggregate([
      {
        $group: {
          _id: '$departmentEnglish',
          marathi: { $first: '$departmentMarathi' },
          building: { $first: '$buildingEnglish' },
          recordCount: { $sum: 1 },
          totalPhysicalQty: { $sum: '$totalQty' },
          usableQty: { $sum: '$usableQty' },
          damagedQty: { $sum: '$damagedQty' },
        },
      },
      { $sort: { totalPhysicalQty: -1 } },
    ]);

    res.json({ success: true, count: departments.length, data: departments });
  } catch (error) {
    next(error);
  }
};

/**
 * Get stats grouped by Category (Seating, Storage, etc.)
 */
exports.getByCategory = async (req, res, next) => {
  try {
    const categories = await Item.aggregate([
      {
        $group: {
          _id: '$category',
          recordCount: { $sum: 1 },
          totalPhysicalQty: { $sum: '$totalQty' },
          usableQty: { $sum: '$usableQty' },
          damagedQty: { $sum: '$damagedQty' },
        },
      },
      { $sort: { totalPhysicalQty: -1 } },
    ]);

    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};
