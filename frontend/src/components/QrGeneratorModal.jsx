import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, QrCode, Download, Printer, PlusCircle, CheckCircle } from 'lucide-react';
import { createItem } from '../services/api';

export default function QrGeneratorModal({ isOpen, onClose, onAssetCreated }) {
  const [activeMode, setActiveMode] = useState('register'); // 'register' or 'custom'
  
  // Custom QR state
  const [customText, setCustomText] = useState('MBMC-MOD-9999');
  const [qrDataUrl, setQrDataUrl] = useState('');

  // New asset form state
  const [formData, setFormData] = useState({
    nameEnglish: '',
    nameMarathi: '',
    category: 'Seating',
    departmentEnglish: '',
    departmentMarathi: '',
    buildingEnglish: 'MBMC Main Head Office',
    floorEnglish: 'Ground Floor',
    usableQty: 1,
    damagedQty: 0,
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (customText) {
      QRCode.toDataURL(customText, { width: 240, margin: 2 })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error(err));
    }
  }, [customText]);

  if (!isOpen) return null;

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    try {
      const payload = {
        ...formData,
        fullLocationEnglish: `${formData.departmentEnglish}, ${formData.floorEnglish}, ${formData.buildingEnglish}`,
        fullLocationMarathi: `${formData.departmentMarathi || formData.departmentEnglish}, ${formData.floorEnglish}, ${formData.buildingEnglish}`,
        totalQty: parseInt(formData.usableQty, 10) + parseInt(formData.damagedQty, 10),
      };

      const res = await createItem(payload);
      if (res.data) {
        setSuccessMsg(`Asset registered successfully! Assigned Code: ${res.data.assetCode}, Model: ${res.data.modelNumber}`);
        if (onAssetCreated) onAssetCreated(res.data);
      }
    } catch (err) {
      alert(`Error registering asset: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <QrCode size={20} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '18px' }}>Generate QR & Register Asset</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
          <button
            className={`btn ${activeMode === 'register' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => setActiveMode('register')}
          >
            <PlusCircle size={15} /> Register New Asset
          </button>
          <button
            className={`btn ${activeMode === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => setActiveMode('custom')}
          >
            <QrCode size={15} /> Custom QR Code
          </button>
        </div>

        {successMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            <CheckCircle size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {activeMode === 'register' ? (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Item Name (English)*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Officer Chair"
                  value={formData.nameEnglish}
                  onChange={(e) => setFormData({ ...formData, nameEnglish: e.target.value })}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Item Name (Marathi)</label>
                <input
                  type="text"
                  placeholder="e.g. अधिकारी खुर्ची"
                  value={formData.nameMarathi}
                  onChange={(e) => setFormData({ ...formData, nameMarathi: e.target.value })}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '13px' }}
                >
                  <option value="Seating">Seating</option>
                  <option value="Desks & Tables">Desks & Tables</option>
                  <option value="Storage">Storage</option>
                  <option value="Fixtures & Stands">Fixtures & Stands</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Department (English)*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Town Planning Dept"
                  value={formData.departmentEnglish}
                  onChange={(e) => setFormData({ ...formData, departmentEnglish: e.target.value })}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Floor</label>
                <select
                  value={formData.floorEnglish}
                  onChange={(e) => setFormData({ ...formData, floorEnglish: e.target.value })}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '13px' }}
                >
                  <option value="Ground Floor">Ground Floor</option>
                  <option value="1st Floor">1st Floor</option>
                  <option value="2nd Floor">2nd Floor</option>
                  <option value="3rd Floor">3rd Floor</option>
                  <option value="4th Floor">4th Floor</option>
                  <option value="5th Floor">5th Floor</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Building</label>
                <input
                  type="text"
                  value={formData.buildingEnglish}
                  onChange={(e) => setFormData({ ...formData, buildingEnglish: e.target.value })}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Usable Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={formData.usableQty}
                  onChange={(e) => setFormData({ ...formData, usableQty: e.target.value })}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8' }}>Damaged Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={formData.damagedQty}
                  onChange={(e) => setFormData({ ...formData, damagedQty: e.target.value })}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '13px' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: '10px' }}>
              {saving ? 'Registering & Generating QR...' : 'Register Asset & Generate QR'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <label style={{ display: 'block', textAlign: 'left', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
              Text or URL to Encode:
            </label>
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Enter Model No, Code, or URL..."
              style={{
                width: '100%',
                background: '#0f172a',
                border: '1px solid #38bdf8',
                color: '#fff',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'monospace',
                marginBottom: '16px',
              }}
            />

            {qrDataUrl && (
              <div style={{ background: '#0f172a', padding: '16px', borderRadius: '12px', display: 'inline-block' }}>
                <img src={qrDataUrl} alt="Custom QR" style={{ width: '180px', height: '180px', display: 'block' }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
              <a href={qrDataUrl} download={`MBMC-${customText}-qr.png`} className="btn btn-primary">
                <Download size={14} /> Download PNG
              </a>
              <a href={`/scan/${encodeURIComponent(customText)}`} target="_blank" rel="noreferrer" className="btn btn-secondary">
                View Scan Page
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
