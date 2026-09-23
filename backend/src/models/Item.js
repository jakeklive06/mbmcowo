const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['Initial Import', 'Verification Scan', 'Condition Check', 'Report Damage', 'Maintenance Completed', 'Status Update', 'Quantity Update'],
    default: 'Condition Check',
  },
  status: {
    type: String,
  },
  usableQty: {
    type: Number,
  },
  damagedQty: {
    type: Number,
  },
  notes: {
    type: String,
    trim: true,
  },
  reportedBy: {
    type: String,
    default: 'Field Auditor / QR Scan',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const itemSchema = new mongoose.Schema(
  {
    assetCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    modelNumber: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
      sparse: true,
    },
    nameEnglish: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    nameMarathi: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Seating', 'Desks & Tables', 'Storage', 'Fixtures & Stands', 'Miscellaneous'],
      default: 'Miscellaneous',
      index: true,
    },
    departmentEnglish: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    departmentMarathi: {
      type: String,
      trim: true,
    },
    buildingEnglish: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    buildingMarathi: {
      type: String,
      trim: true,
    },
    floorEnglish: {
      type: String,
      default: 'Unspecified',
      trim: true,
      index: true,
    },
    floorMarathi: {
      type: String,
      default: '',
      trim: true,
    },
    ward: {
      type: String,
      default: 'MBMC',
      trim: true,
      index: true,
    },
    fullLocationEnglish: {
      type: String,
      required: true,
      trim: true,
    },
    fullLocationMarathi: {
      type: String,
      required: true,
      trim: true,
    },
    usableQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    damagedQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Operational', 'Partially Damaged', 'Damaged', 'Under Repair', 'Decommissioned'],
      default: 'Operational',
      index: true,
    },
    conditionSummary: {
      type: String,
      default: '',
    },
    qrCode: {
      dataUrl: {
        type: String,
        required: true,
      },
      scanUrl: {
        type: String,
        required: true,
      },
    },
    sourceFile: {
      type: String,
      trim: true,
    },
    lastAuditedAt: {
      type: Date,
      default: Date.now,
    },
    auditHistory: [auditLogSchema],
  },
  {
    timestamps: true,
  }
);

// Compound text index for global search
itemSchema.index({
  assetCode: 'text',
  modelNumber: 'text',
  nameEnglish: 'text',
  nameMarathi: 'text',
  departmentEnglish: 'text',
  buildingEnglish: 'text',
  fullLocationEnglish: 'text',
});

module.exports = mongoose.model('Item', itemSchema);
