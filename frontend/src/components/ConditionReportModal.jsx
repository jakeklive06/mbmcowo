import React, { useState } from 'react';
import { X, Wrench, CheckCircle } from 'lucide-react';
import { updateItem } from '../services/api';

export default function ConditionReportModal({ isOpen, asset, onClose, onUpdated }) {
  if (!isOpen || !asset) return null;

  const [status, setStatus] = useState(asset.status || 'Operational');
  const [usableQty, setUsableQty] = useState(asset.usableQty || 0);
  const [damagedQty, setDamagedQty] = useState(asset.damagedQty || 0);
  const [notes, setNotes] = useState('');
  const [updatedBy, setUpdatedBy] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        status,
        usableQty: parseInt(usableQty, 10),
        damagedQty: parseInt(damagedQty, 10),
        notes,
        updatedBy: updatedBy || 'Frontend Auditor',
      };
      const res = await updateItem(asset._id, payload);
      if (res.data) {
        if (onUpdated) onUpdated(res.data);
        onClose();
      }
    } catch (err) {
      alert(`Error updating condition: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wrench size={20} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '18px' }}>Update Asset Condition</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: '14px', fontSize: '13px', color: '#94a3b8' }}>
          Asset Tag: <strong style={{ color: '#38bdf8' }}>{asset.assetCode}</strong> &bull; Unit: <strong style={{ color: '#facc15' }}>{asset.unitLabel || 'Unit ' + (asset.unitNumber || 1)}</strong>
          <div style={{ color: '#fff', fontWeight: 600, marginTop: '2px' }}>{asset.nameEnglish} ({asset.nameMarathi})</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{asset.fullLocationEnglish}</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Condition Status for this Unit</label>
            <select
              value={status}
              onChange={(e) => {
                const newStatus = e.target.value;
                setStatus(newStatus);
                if (newStatus === 'Operational') {
                  setUsableQty(1);
                  setDamagedQty(0);
                } else if (newStatus === 'Damaged' || newStatus === 'Partially Damaged') {
                  setUsableQty(0);
                  setDamagedQty(1);
                }
              }}
              style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '13px' }}
            >
              <option value="Operational">Operational (Fine / Good condition)</option>
              <option value="Damaged">Damaged (Broken / Needs repair)</option>
              <option value="Partially Damaged">Partially Damaged</option>
              <option value="Under Repair">Under Repair</option>
              <option value="Decommissioned">Decommissioned</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Inspector / Officer Name</label>
            <input
              type="text"
              placeholder="e.g. Inspector Sharma"
              value={updatedBy}
              onChange={(e) => setUpdatedBy(e.target.value)}
              style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Audit Notes / Defect Details</label>
            <textarea
              rows="3"
              placeholder="Describe condition, required repair, or parts needed..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '13px', resize: 'vertical' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: '6px' }}>
            {saving ? 'Updating Condition...' : 'Submit Condition Update'}
          </button>
        </form>
      </div>
    </div>
  );
}
